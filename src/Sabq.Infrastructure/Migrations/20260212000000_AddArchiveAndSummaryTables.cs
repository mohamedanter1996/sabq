using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sabq.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddArchiveAndSummaryTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // =================================================================
            // Archive Table: GameAnswersArchive
            // =================================================================
            migrationBuilder.CreateTable(
                name: "GameAnswersArchive",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuestionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PlayerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OptionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsCorrect = table.Column<bool>(type: "bit", nullable: false),
                    AnsweredAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ArchivedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GameAnswersArchive", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GameAnswersArchive_AnsweredAtUtc",
                table: "GameAnswersArchive",
                column: "AnsweredAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_GameAnswersArchive_RoomId",
                table: "GameAnswersArchive",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_GameAnswersArchive_PlayerId",
                table: "GameAnswersArchive",
                column: "PlayerId");

            // =================================================================
            // Summary Table: GameRoomSummary
            // =================================================================
            migrationBuilder.CreateTable(
                name: "GameRoomSummary",
                columns: table => new
                {
                    RoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FinishedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TotalPlayers = table.Column<int>(type: "int", nullable: false),
                    TotalQuestions = table.Column<int>(type: "int", nullable: false),
                    WinnerPlayerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    MaxScore = table.Column<int>(type: "int", nullable: false),
                    IsArchived = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GameRoomSummary", x => x.RoomId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GameRoomSummary_IsArchived",
                table: "GameRoomSummary",
                column: "IsArchived");

            // =================================================================
            // Summary Table: GameRoomPlayerSummary
            // =================================================================
            migrationBuilder.CreateTable(
                name: "GameRoomPlayerSummary",
                columns: table => new
                {
                    RoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PlayerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Score = table.Column<int>(type: "int", nullable: false),
                    AnsweredCount = table.Column<int>(type: "int", nullable: false),
                    CorrectAnswers = table.Column<int>(type: "int", nullable: false),
                    WrongAnswers = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GameRoomPlayerSummary", x => new { x.RoomId, x.PlayerId });
                });

            migrationBuilder.CreateIndex(
                name: "IX_GameRoomPlayerSummary_PlayerId",
                table: "GameRoomPlayerSummary",
                column: "PlayerId");

            // =================================================================
            // Job Log Table: ArchiveJobLogs
            // =================================================================
            migrationBuilder.CreateTable(
                name: "ArchiveJobLogs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RunAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    RetentionDays = table.Column<int>(type: "int", nullable: false),
                    BatchSize = table.Column<int>(type: "int", nullable: false),
                    ArchivedAnswersCount = table.Column<long>(type: "bigint", nullable: false),
                    AffectedRoomsCount = table.Column<int>(type: "int", nullable: false),
                    DurationMs = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArchiveJobLogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ArchiveJobLogs_RunAtUtc",
                table: "ArchiveJobLogs",
                column: "RunAtUtc",
                descending: new[] { true });

            // =================================================================
            // Create the Stored Procedure
            // =================================================================
            migrationBuilder.Sql(@"
CREATE PROCEDURE dbo.usp_ArchiveAndSummarizeOldGames
    @RetentionDays INT = 90,
    @BatchSize     INT = 10000
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    DECLARE @StartTime      DATETIME2       = SYSUTCDATETIME();
    DECLARE @Cutoff         DATETIME2       = DATEADD(DAY, -@RetentionDays, SYSUTCDATETIME());
    DECLARE @TotalArchived  BIGINT          = 0;
    DECLARE @BatchArchived  INT             = 0;
    DECLARE @RoomCount      INT             = 0;
    DECLARE @DurationMs     BIGINT          = 0;
    DECLARE @ErrorMessage   NVARCHAR(4000)  = NULL;
    
    BEGIN TRY
        -- Identify old rooms (all answers are older than cutoff)
        CREATE TABLE #OldRooms (RoomId UNIQUEIDENTIFIER PRIMARY KEY);
        
        INSERT INTO #OldRooms (RoomId)
        SELECT ga.RoomId
        FROM dbo.GameAnswers ga WITH (NOLOCK)
        GROUP BY ga.RoomId
        HAVING MAX(ga.AnsweredAtUtc) < @Cutoff;
        
        SET @RoomCount = @@ROWCOUNT;
        
        IF @RoomCount = 0
        BEGIN
            INSERT INTO dbo.ArchiveJobLogs (RetentionDays, BatchSize, ArchivedAnswersCount, AffectedRoomsCount, DurationMs, Status)
            VALUES (@RetentionDays, @BatchSize, 0, 0, DATEDIFF(MILLISECOND, @StartTime, SYSUTCDATETIME()), 'Success');
            
            DROP TABLE #OldRooms;
            RETURN;
        END
        
        -- Build Room Summary
        MERGE INTO dbo.GameRoomSummary AS tgt
        USING (
            SELECT 
                r.RoomId,
                gr.CreatedAt AS CreatedAtUtc,
                (SELECT MAX(ga2.AnsweredAtUtc) FROM dbo.GameAnswers ga2 WHERE ga2.RoomId = r.RoomId) AS FinishedAtUtc,
                (SELECT COUNT(DISTINCT grp.PlayerId) FROM dbo.GameRoomPlayers grp WHERE grp.RoomId = r.RoomId) AS TotalPlayers,
                (SELECT COUNT(DISTINCT grq.QuestionId) FROM dbo.GameRoomQuestions grq WHERE grq.RoomId = r.RoomId) AS TotalQuestions,
                (SELECT TOP 1 grp.PlayerId FROM dbo.GameRoomPlayers grp WHERE grp.RoomId = r.RoomId ORDER BY grp.Score DESC) AS WinnerPlayerId,
                ISNULL((SELECT MAX(grp.Score) FROM dbo.GameRoomPlayers grp WHERE grp.RoomId = r.RoomId), 0) AS MaxScore
            FROM #OldRooms r
            INNER JOIN dbo.GameRooms gr ON gr.Id = r.RoomId
        ) AS src
        ON tgt.RoomId = src.RoomId
        WHEN MATCHED THEN
            UPDATE SET FinishedAtUtc = src.FinishedAtUtc, TotalPlayers = src.TotalPlayers, TotalQuestions = src.TotalQuestions, WinnerPlayerId = src.WinnerPlayerId, MaxScore = src.MaxScore, IsArchived = 1
        WHEN NOT MATCHED THEN
            INSERT (RoomId, CreatedAtUtc, FinishedAtUtc, TotalPlayers, TotalQuestions, WinnerPlayerId, MaxScore, IsArchived)
            VALUES (src.RoomId, src.CreatedAtUtc, src.FinishedAtUtc, src.TotalPlayers, src.TotalQuestions, src.WinnerPlayerId, src.MaxScore, 1);
        
        -- Build Player Summary
        MERGE INTO dbo.GameRoomPlayerSummary AS tgt
        USING (
            SELECT grp.RoomId, grp.PlayerId, grp.Score, COUNT(ga.Id) AS AnsweredCount, SUM(CASE WHEN ga.IsCorrect = 1 THEN 1 ELSE 0 END) AS CorrectAnswers, SUM(CASE WHEN ga.IsCorrect = 0 THEN 1 ELSE 0 END) AS WrongAnswers, SYSUTCDATETIME() AS CreatedAtUtc
            FROM #OldRooms r
            INNER JOIN dbo.GameRoomPlayers grp ON grp.RoomId = r.RoomId
            LEFT JOIN dbo.GameAnswers ga ON ga.RoomId = r.RoomId AND ga.PlayerId = grp.PlayerId
            GROUP BY grp.RoomId, grp.PlayerId, grp.Score
        ) AS src
        ON tgt.RoomId = src.RoomId AND tgt.PlayerId = src.PlayerId
        WHEN MATCHED THEN
            UPDATE SET Score = src.Score, AnsweredCount = src.AnsweredCount, CorrectAnswers = src.CorrectAnswers, WrongAnswers = src.WrongAnswers
        WHEN NOT MATCHED THEN
            INSERT (RoomId, PlayerId, Score, AnsweredCount, CorrectAnswers, WrongAnswers, CreatedAtUtc)
            VALUES (src.RoomId, src.PlayerId, src.Score, src.AnsweredCount, src.CorrectAnswers, src.WrongAnswers, src.CreatedAtUtc);
        
        -- Archive answers in batches
        SET @BatchArchived = 1;
        
        WHILE @BatchArchived > 0
        BEGIN
            BEGIN TRANSACTION;
            
            INSERT INTO dbo.GameAnswersArchive (Id, RoomId, QuestionId, PlayerId, OptionId, IsCorrect, AnsweredAtUtc)
            SELECT TOP (@BatchSize) ga.Id, ga.RoomId, ga.QuestionId, ga.PlayerId, ga.OptionId, ga.IsCorrect, ga.AnsweredAtUtc
            FROM dbo.GameAnswers ga WITH (READPAST)
            WHERE ga.RoomId IN (SELECT RoomId FROM #OldRooms)
              AND NOT EXISTS (SELECT 1 FROM dbo.GameAnswersArchive arc WHERE arc.Id = ga.Id);
            
            SET @BatchArchived = @@ROWCOUNT;
            SET @TotalArchived = @TotalArchived + @BatchArchived;
            
            IF @BatchArchived > 0
            BEGIN
                DELETE TOP (@BatchSize) ga
                FROM dbo.GameAnswers ga
                WHERE ga.RoomId IN (SELECT RoomId FROM #OldRooms)
                  AND EXISTS (SELECT 1 FROM dbo.GameAnswersArchive arc WHERE arc.Id = ga.Id);
            END
            
            COMMIT TRANSACTION;
            WAITFOR DELAY '00:00:00.050';
        END
        
        SET @DurationMs = DATEDIFF(MILLISECOND, @StartTime, SYSUTCDATETIME());
        
        INSERT INTO dbo.ArchiveJobLogs (RetentionDays, BatchSize, ArchivedAnswersCount, AffectedRoomsCount, DurationMs, Status)
        VALUES (@RetentionDays, @BatchSize, @TotalArchived, @RoomCount, @DurationMs, 'Success');
        
        DROP TABLE #OldRooms;
        
        SELECT @TotalArchived AS ArchivedAnswersCount, @RoomCount AS AffectedRoomsCount, @StartTime AS StartedAtUtc, SYSUTCDATETIME() AS FinishedAtUtc, @DurationMs AS DurationMs;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        
        SET @ErrorMessage = ERROR_MESSAGE();
        SET @DurationMs = DATEDIFF(MILLISECOND, @StartTime, SYSUTCDATETIME());
        
        INSERT INTO dbo.ArchiveJobLogs (RetentionDays, BatchSize, ArchivedAnswersCount, AffectedRoomsCount, DurationMs, Status, ErrorMessage)
        VALUES (@RetentionDays, @BatchSize, @TotalArchived, @RoomCount, @DurationMs, 'Failed', @ErrorMessage);
        
        IF OBJECT_ID('tempdb..#OldRooms') IS NOT NULL DROP TABLE #OldRooms;
        
        THROW;
    END CATCH
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS dbo.usp_ArchiveAndSummarizeOldGames");
            
            migrationBuilder.DropTable(name: "ArchiveJobLogs");
            migrationBuilder.DropTable(name: "GameRoomPlayerSummary");
            migrationBuilder.DropTable(name: "GameRoomSummary");
            migrationBuilder.DropTable(name: "GameAnswersArchive");
        }
    }
}
