using Sabq.Shared.DTOs;
using Xunit;

namespace Sabq.Tests;

/// <summary>
/// Tests for DTOs used in archive and game history endpoints.
/// </summary>
public class DtoTests
{
    /// <summary>
    /// Tests that ArchiveJobResultDto contains all required properties.
    /// </summary>
    [Fact]
    public void ArchiveJobResultDto_ContainsAllProperties()
    {
        // Arrange
        var startedAt = DateTime.UtcNow;
        var finishedAt = DateTime.UtcNow.AddMinutes(5);

        // Act
        var dto = new ArchiveJobResultDto(
            ArchivedAnswersCount: 1000,
            AffectedRoomsCount: 50,
            StartedAtUtc: startedAt,
            FinishedAtUtc: finishedAt,
            DurationMs: 300000
        );

        // Assert
        Assert.Equal(1000, dto.ArchivedAnswersCount);
        Assert.Equal(50, dto.AffectedRoomsCount);
        Assert.Equal(startedAt, dto.StartedAtUtc);
        Assert.Equal(finishedAt, dto.FinishedAtUtc);
        Assert.Equal(300000, dto.DurationMs);
    }

    /// <summary>
    /// Tests that GameRoomSummaryDto contains all required properties.
    /// </summary>
    [Fact]
    public void GameRoomSummaryDto_ContainsAllProperties()
    {
        // Arrange
        var roomId = Guid.NewGuid();
        var winnerId = Guid.NewGuid();
        var createdAt = DateTime.UtcNow.AddDays(-100);
        var finishedAt = createdAt.AddHours(1);

        var playerSummaries = new List<GameRoomPlayerSummaryDto>
        {
            new(winnerId, "Winner", 10, 15, 10, 5, 66.67)
        };

        // Act
        var dto = new GameRoomSummaryDto(
            RoomId: roomId,
            CreatedAtUtc: createdAt,
            FinishedAtUtc: finishedAt,
            TotalPlayers: 3,
            TotalQuestions: 15,
            WinnerPlayerId: winnerId,
            WinnerDisplayName: "Winner",
            MaxScore: 10,
            IsArchived: true,
            PlayerSummaries: playerSummaries
        );

        // Assert
        Assert.Equal(roomId, dto.RoomId);
        Assert.Equal(createdAt, dto.CreatedAtUtc);
        Assert.Equal(finishedAt, dto.FinishedAtUtc);
        Assert.Equal(3, dto.TotalPlayers);
        Assert.Equal(15, dto.TotalQuestions);
        Assert.Equal(winnerId, dto.WinnerPlayerId);
        Assert.Equal("Winner", dto.WinnerDisplayName);
        Assert.Equal(10, dto.MaxScore);
        Assert.True(dto.IsArchived);
        Assert.Single(dto.PlayerSummaries);
    }

    /// <summary>
    /// Tests GameRoomPlayerSummaryDto accuracy calculation.
    /// </summary>
    [Theory]
    [InlineData(10, 10, 0, 100.0)]
    [InlineData(10, 5, 5, 50.0)]
    [InlineData(10, 0, 10, 0.0)]
    [InlineData(15, 10, 5, 66.67)]
    public void GameRoomPlayerSummaryDto_AccuracyCalculation(
        int answered, int correct, int wrong, double expectedAccuracy)
    {
        // Arrange & Act
        var dto = new GameRoomPlayerSummaryDto(
            PlayerId: Guid.NewGuid(),
            DisplayName: "Test",
            Score: correct,
            AnsweredCount: answered,
            CorrectAnswers: correct,
            WrongAnswers: wrong,
            AccuracyPercent: expectedAccuracy
        );

        // Assert
        Assert.Equal(expectedAccuracy, dto.AccuracyPercent);
        Assert.Equal(answered, dto.CorrectAnswers + dto.WrongAnswers);
    }

    /// <summary>
    /// Tests that GameHistoryDto properly distinguishes archived vs non-archived games.
    /// </summary>
    [Fact]
    public void GameHistoryDto_ArchivedGame_HasSummaryNotDetails()
    {
        // Arrange
        var summary = new GameRoomSummaryDto(
            RoomId: Guid.NewGuid(),
            CreatedAtUtc: DateTime.UtcNow.AddDays(-100),
            FinishedAtUtc: DateTime.UtcNow.AddDays(-100).AddHours(1),
            TotalPlayers: 3,
            TotalQuestions: 15,
            WinnerPlayerId: Guid.NewGuid(),
            WinnerDisplayName: "Winner",
            MaxScore: 10,
            IsArchived: true,
            PlayerSummaries: new List<GameRoomPlayerSummaryDto>()
        );

        // Act - Archived game
        var archivedDto = new GameHistoryDto(
            RoomId: Guid.NewGuid(),
            RoomCode: "ARCH01",
            CreatedAtUtc: DateTime.UtcNow.AddDays(-100),
            FinishedAtUtc: DateTime.UtcNow.AddDays(-100).AddHours(1),
            TotalPlayers: 3,
            TotalQuestions: 15,
            IsArchived: true,
            Players: null,    // No detailed player data
            Answers: null,    // No detailed answers
            Summary: summary
        );

        // Assert
        Assert.True(archivedDto.IsArchived);
        Assert.Null(archivedDto.Players);
        Assert.Null(archivedDto.Answers);
        Assert.NotNull(archivedDto.Summary);
    }

    /// <summary>
    /// Tests that GameHistoryDto properly distinguishes non-archived games.
    /// </summary>
    [Fact]
    public void GameHistoryDto_RecentGame_HasDetailsNotSummary()
    {
        // Arrange
        var players = new List<GameHistoryPlayerDto>
        {
            new(Guid.NewGuid(), "Player1", 5, DateTime.UtcNow)
        };
        var answers = new List<GameHistoryAnswerDto>
        {
            new(Guid.NewGuid(), players[0].PlayerId, Guid.NewGuid(), Guid.NewGuid(), true, DateTime.UtcNow)
        };

        // Act - Recent game
        var recentDto = new GameHistoryDto(
            RoomId: Guid.NewGuid(),
            RoomCode: "RECV01",
            CreatedAtUtc: DateTime.UtcNow.AddDays(-5),
            FinishedAtUtc: DateTime.UtcNow.AddDays(-5).AddHours(1),
            TotalPlayers: 1,
            TotalQuestions: 1,
            IsArchived: false,
            Players: players,
            Answers: answers,
            Summary: null
        );

        // Assert
        Assert.False(recentDto.IsArchived);
        Assert.NotNull(recentDto.Players);
        Assert.NotNull(recentDto.Answers);
        Assert.Null(recentDto.Summary);
    }
}
