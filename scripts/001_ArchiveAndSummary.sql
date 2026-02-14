/*
================================================================================
 ARCHIVE AND SUMMARY SOLUTION FOR GAME ANSWERS
 Sabq Quiz Game - Data Retention & Summary Tables
 Created: 2026-02-12
 
 Purpose:
   - Archive GameAnswers older than 90 days
   - Provide summary tables for historical game data
   - Maintain audit trail via job logs
================================================================================
*/

SET NOCOUNT ON;
GO

-- =============================================================================
-- 1. ARCHIVE TABLE: dbo.GameAnswersArchive
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'GameAnswersArchive' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.GameAnswersArchive
    (
        Id              UNIQUEIDENTIFIER NOT NULL,
        RoomId          UNIQUEIDENTIFIER NOT NULL,
        QuestionId      UNIQUEIDENTIFIER NOT NULL,
        PlayerId        UNIQUEIDENTIFIER NOT NULL,
        OptionId        UNIQUEIDENTIFIER NOT NULL,
        IsCorrect       BIT              NOT NULL,
        AnsweredAtUtc   DATETIME2        NOT NULL,
        ArchivedAtUtc   DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        
        CONSTRAINT PK_GameAnswersArchive PRIMARY KEY CLUSTERED (Id)
    );
    
    PRINT 'Created table: dbo.GameAnswersArchive';
END
GO

-- Indexes for GameAnswersArchive
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GameAnswersArchive_AnsweredAtUtc' AND object_id = OBJECT_ID('dbo.GameAnswersArchive'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_GameAnswersArchive_AnsweredAtUtc 
    ON dbo.GameAnswersArchive (AnsweredAtUtc);
    
    PRINT 'Created index: IX_GameAnswersArchive_AnsweredAtUtc';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GameAnswersArchive_RoomId' AND object_id = OBJECT_ID('dbo.GameAnswersArchive'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_GameAnswersArchive_RoomId 
    ON dbo.GameAnswersArchive (RoomId);
    
    PRINT 'Created index: IX_GameAnswersArchive_RoomId';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GameAnswersArchive_PlayerId' AND object_id = OBJECT_ID('dbo.GameAnswersArchive'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_GameAnswersArchive_PlayerId 
    ON dbo.GameAnswersArchive (PlayerId);
    
    PRINT 'Created index: IX_GameAnswersArchive_PlayerId';
END
GO

-- =============================================================================
-- 2. SUMMARY TABLE: dbo.GameRoomSummary
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'GameRoomSummary' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.GameRoomSummary
    (
        RoomId          UNIQUEIDENTIFIER NOT NULL,
        CreatedAtUtc    DATETIME2        NOT NULL,
        FinishedAtUtc   DATETIME2        NULL,
        TotalPlayers    INT              NOT NULL,
        TotalQuestions  INT              NOT NULL,
        WinnerPlayerId  UNIQUEIDENTIFIER NULL,
        MaxScore        INT              NOT NULL,
        IsArchived      BIT              NOT NULL DEFAULT 0,
        
        CONSTRAINT PK_GameRoomSummary PRIMARY KEY CLUSTERED (RoomId)
    );
    
    PRINT 'Created table: dbo.GameRoomSummary';
END
GO

-- Index for finding archived rooms
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GameRoomSummary_IsArchived' AND object_id = OBJECT_ID('dbo.GameRoomSummary'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_GameRoomSummary_IsArchived 
    ON dbo.GameRoomSummary (IsArchived) 
    INCLUDE (RoomId, CreatedAtUtc);
    
    PRINT 'Created index: IX_GameRoomSummary_IsArchived';
END
GO

-- =============================================================================
-- 3. SUMMARY TABLE: dbo.GameRoomPlayerSummary
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'GameRoomPlayerSummary' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.GameRoomPlayerSummary
    (
        RoomId          UNIQUEIDENTIFIER NOT NULL,
        PlayerId        UNIQUEIDENTIFIER NOT NULL,
        Score           INT              NOT NULL,
        AnsweredCount   INT              NOT NULL,
        CorrectAnswers  INT              NOT NULL,
        WrongAnswers    INT              NOT NULL,
        CreatedAtUtc    DATETIME2        NOT NULL,
        
        CONSTRAINT PK_GameRoomPlayerSummary PRIMARY KEY CLUSTERED (RoomId, PlayerId)
    );
    
    PRINT 'Created table: dbo.GameRoomPlayerSummary';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GameRoomPlayerSummary_PlayerId' AND object_id = OBJECT_ID('dbo.GameRoomPlayerSummary'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_GameRoomPlayerSummary_PlayerId 
    ON dbo.GameRoomPlayerSummary (PlayerId);
    
    PRINT 'Created index: IX_GameRoomPlayerSummary_PlayerId';
END
GO

-- =============================================================================
-- 4. JOB LOG TABLE: dbo.ArchiveJobLogs
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ArchiveJobLogs' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.ArchiveJobLogs
    (
        Id                      BIGINT           IDENTITY(1,1) NOT NULL,
        RunAtUtc                DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        RetentionDays           INT              NOT NULL,
        BatchSize               INT              NOT NULL,
        ArchivedAnswersCount    BIGINT           NOT NULL,
        AffectedRoomsCount      INT              NOT NULL,
        DurationMs              BIGINT           NOT NULL,
        Status                  NVARCHAR(20)     NOT NULL, -- Success / Failed
        ErrorMessage            NVARCHAR(4000)   NULL,
        
        CONSTRAINT PK_ArchiveJobLogs PRIMARY KEY CLUSTERED (Id)
    );
    
    PRINT 'Created table: dbo.ArchiveJobLogs';
END
GO

-- Index for monitoring recent jobs
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ArchiveJobLogs_RunAtUtc' AND object_id = OBJECT_ID('dbo.ArchiveJobLogs'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ArchiveJobLogs_RunAtUtc 
    ON dbo.ArchiveJobLogs (RunAtUtc DESC);
    
    PRINT 'Created index: IX_ArchiveJobLogs_RunAtUtc';
END
GO

-- =============================================================================
-- 5. STORED PROCEDURE: dbo.usp_ArchiveAndSummarizeOldGames
-- =============================================================================
IF OBJECT_ID('dbo.usp_ArchiveAndSummarizeOldGames', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_ArchiveAndSummarizeOldGames;
GO

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
        -- =====================================================================
        -- STEP 1: Identify old rooms (all answers are older than cutoff)
        -- Using temp table for performance with large datasets
        -- =====================================================================
        CREATE TABLE #OldRooms (RoomId UNIQUEIDENTIFIER PRIMARY KEY);
        
        -- Rooms are "old" if:
        -- 1. They have answers, AND
        -- 2. ALL their answers are older than cutoff (no recent activity)
        -- We check MAX(AnsweredAtUtc) < @Cutoff
        INSERT INTO #OldRooms (RoomId)
        SELECT ga.RoomId
        FROM dbo.GameAnswers ga WITH (NOLOCK)
        GROUP BY ga.RoomId
        HAVING MAX(ga.AnsweredAtUtc) < @Cutoff;
        
        SET @RoomCount = @@ROWCOUNT;
        
        IF @RoomCount = 0
        BEGIN
            -- No rooms to archive, log success and exit
            INSERT INTO dbo.ArchiveJobLogs (RetentionDays, BatchSize, ArchivedAnswersCount, AffectedRoomsCount, DurationMs, Status)
            VALUES (@RetentionDays, @BatchSize, 0, 0, DATEDIFF(MILLISECOND, @StartTime, SYSUTCDATETIME()), 'Success');
            
            DROP TABLE #OldRooms;
            RETURN;
        END
        
        -- =====================================================================
        -- STEP 2: Build/Update summaries (MERGE pattern for upsert)
        -- =====================================================================
        
        -- 2a. Room Summary
        MERGE INTO dbo.GameRoomSummary AS tgt
        USING (
            SELECT 
                r.RoomId,
                gr.CreatedAt AS CreatedAtUtc,
                (SELECT MAX(ga2.AnsweredAtUtc) FROM dbo.GameAnswers ga2 WHERE ga2.RoomId = r.RoomId) AS FinishedAtUtc,
                (SELECT COUNT(DISTINCT grp.PlayerId) FROM dbo.GameRoomPlayers grp WHERE grp.RoomId = r.RoomId) AS TotalPlayers,
                (SELECT COUNT(DISTINCT grq.QuestionId) FROM dbo.GameRoomQuestions grq WHERE grq.RoomId = r.RoomId) AS TotalQuestions,
                (
                    SELECT TOP 1 grp.PlayerId 
                    FROM dbo.GameRoomPlayers grp 
                    WHERE grp.RoomId = r.RoomId 
                    ORDER BY grp.Score DESC
                ) AS WinnerPlayerId,
                ISNULL((SELECT MAX(grp.Score) FROM dbo.GameRoomPlayers grp WHERE grp.RoomId = r.RoomId), 0) AS MaxScore
            FROM #OldRooms r
            INNER JOIN dbo.GameRooms gr ON gr.Id = r.RoomId
        ) AS src
        ON tgt.RoomId = src.RoomId
        WHEN MATCHED THEN
            UPDATE SET 
                FinishedAtUtc   = src.FinishedAtUtc,
                TotalPlayers    = src.TotalPlayers,
                TotalQuestions  = src.TotalQuestions,
                WinnerPlayerId  = src.WinnerPlayerId,
                MaxScore        = src.MaxScore,
                IsArchived      = 1
        WHEN NOT MATCHED THEN
            INSERT (RoomId, CreatedAtUtc, FinishedAtUtc, TotalPlayers, TotalQuestions, WinnerPlayerId, MaxScore, IsArchived)
            VALUES (src.RoomId, src.CreatedAtUtc, src.FinishedAtUtc, src.TotalPlayers, src.TotalQuestions, src.WinnerPlayerId, src.MaxScore, 1);
        
        -- 2b. Player Summary per room
        MERGE INTO dbo.GameRoomPlayerSummary AS tgt
        USING (
            SELECT 
                grp.RoomId,
                grp.PlayerId,
                grp.Score,
                COUNT(ga.Id) AS AnsweredCount,
                SUM(CASE WHEN ga.IsCorrect = 1 THEN 1 ELSE 0 END) AS CorrectAnswers,
                SUM(CASE WHEN ga.IsCorrect = 0 THEN 1 ELSE 0 END) AS WrongAnswers,
                SYSUTCDATETIME() AS CreatedAtUtc
            FROM #OldRooms r
            INNER JOIN dbo.GameRoomPlayers grp ON grp.RoomId = r.RoomId
            LEFT JOIN dbo.GameAnswers ga ON ga.RoomId = r.RoomId AND ga.PlayerId = grp.PlayerId
            GROUP BY grp.RoomId, grp.PlayerId, grp.Score
        ) AS src
        ON tgt.RoomId = src.RoomId AND tgt.PlayerId = src.PlayerId
        WHEN MATCHED THEN
            UPDATE SET 
                Score           = src.Score,
                AnsweredCount   = src.AnsweredCount,
                CorrectAnswers  = src.CorrectAnswers,
                WrongAnswers    = src.WrongAnswers
        WHEN NOT MATCHED THEN
            INSERT (RoomId, PlayerId, Score, AnsweredCount, CorrectAnswers, WrongAnswers, CreatedAtUtc)
            VALUES (src.RoomId, src.PlayerId, src.Score, src.AnsweredCount, src.CorrectAnswers, src.WrongAnswers, src.CreatedAtUtc);
        
        -- =====================================================================
        -- STEP 3: Archive answers in batches (prevents long locks)
        -- =====================================================================
        SET @BatchArchived = 1; -- Initialize to enter loop
        
        WHILE @BatchArchived > 0
        BEGIN
            BEGIN TRANSACTION;
            
            -- Insert batch into archive (using NOT EXISTS to prevent duplicates)
            INSERT INTO dbo.GameAnswersArchive (Id, RoomId, QuestionId, PlayerId, OptionId, IsCorrect, AnsweredAtUtc)
            SELECT TOP (@BatchSize) 
                ga.Id, 
                ga.RoomId, 
                ga.QuestionId, 
                ga.PlayerId, 
                ga.OptionId, 
                ga.IsCorrect, 
                ga.AnsweredAtUtc
            FROM dbo.GameAnswers ga WITH (READPAST)  -- Skip locked rows
            WHERE ga.RoomId IN (SELECT RoomId FROM #OldRooms)
              AND NOT EXISTS (SELECT 1 FROM dbo.GameAnswersArchive arc WHERE arc.Id = ga.Id);
            
            SET @BatchArchived = @@ROWCOUNT;
            SET @TotalArchived = @TotalArchived + @BatchArchived;
            
            -- Delete the archived rows
            IF @BatchArchived > 0
            BEGIN
                DELETE TOP (@BatchSize) ga
                FROM dbo.GameAnswers ga
                WHERE ga.RoomId IN (SELECT RoomId FROM #OldRooms)
                  AND EXISTS (SELECT 1 FROM dbo.GameAnswersArchive arc WHERE arc.Id = ga.Id);
            END
            
            COMMIT TRANSACTION;
            
            -- Small delay to reduce lock contention in very busy systems
            -- Can be removed if not needed
            WAITFOR DELAY '00:00:00.050';
        END
        
        -- =====================================================================
        -- STEP 4: Log success
        -- =====================================================================
        SET @DurationMs = DATEDIFF(MILLISECOND, @StartTime, SYSUTCDATETIME());
        
        INSERT INTO dbo.ArchiveJobLogs (RetentionDays, BatchSize, ArchivedAnswersCount, AffectedRoomsCount, DurationMs, Status)
        VALUES (@RetentionDays, @BatchSize, @TotalArchived, @RoomCount, @DurationMs, 'Success');
        
        DROP TABLE #OldRooms;
        
        -- Return summary
        SELECT 
            @TotalArchived AS ArchivedAnswersCount,
            @RoomCount AS AffectedRoomsCount,
            @StartTime AS StartedAtUtc,
            SYSUTCDATETIME() AS FinishedAtUtc,
            @DurationMs AS DurationMs;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @ErrorMessage = ERROR_MESSAGE();
        SET @DurationMs = DATEDIFF(MILLISECOND, @StartTime, SYSUTCDATETIME());
        
        -- Log failure
        INSERT INTO dbo.ArchiveJobLogs (RetentionDays, BatchSize, ArchivedAnswersCount, AffectedRoomsCount, DurationMs, Status, ErrorMessage)
        VALUES (@RetentionDays, @BatchSize, @TotalArchived, @RoomCount, @DurationMs, 'Failed', @ErrorMessage);
        
        IF OBJECT_ID('tempdb..#OldRooms') IS NOT NULL
            DROP TABLE #OldRooms;
        
        -- Re-throw the error
        THROW;
    END CATCH
END
GO

PRINT 'Created stored procedure: dbo.usp_ArchiveAndSummarizeOldGames';
GO

-- =============================================================================
-- VERIFICATION: Quick test of created objects
-- =============================================================================
PRINT '';
PRINT '=== Verification ===';
PRINT 'Tables created:';
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN ('GameAnswersArchive', 'GameRoomSummary', 'GameRoomPlayerSummary', 'ArchiveJobLogs')
  AND TABLE_SCHEMA = 'dbo';

PRINT 'Stored procedure created:';
SELECT ROUTINE_NAME 
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_NAME = 'usp_ArchiveAndSummarizeOldGames' 
  AND ROUTINE_SCHEMA = 'dbo';

PRINT '';
PRINT '=== Script completed successfully ===';
GO
