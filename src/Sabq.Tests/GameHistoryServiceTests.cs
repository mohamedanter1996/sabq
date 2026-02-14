using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Sabq.Application.Services;
using Sabq.Domain.Entities;
using Sabq.Domain.Enums;
using Sabq.Infrastructure.Data;
using Xunit;

namespace Sabq.Tests;

/// <summary>
/// Tests for game history service including summary-only behavior for old games.
/// </summary>
public class GameHistoryServiceTests
{
    /// <summary>
    /// Tests that recent games return detailed data (answers included).
    /// </summary>
    [Fact]
    public async Task GetGameHistoryAsync_RecentGame_ReturnsDetailedData()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<SabqDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new SabqDbContext(options);

        var playerId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        var optionId = Guid.NewGuid();
        var roomId = Guid.NewGuid();

        // Create test data
        var player = new Player { Id = playerId, DisplayName = "TestPlayer", CreatedAt = DateTime.UtcNow };
        context.Players.Add(player);

        var room = new GameRoom
        {
            Id = roomId,
            Code = "RECENT",
            HostPlayerId = playerId,
            Status = RoomStatus.Finished,
            CreatedAt = DateTime.UtcNow.AddDays(-5) // Recent room
        };
        context.GameRooms.Add(room);

        context.GameRoomPlayers.Add(new GameRoomPlayer
        {
            RoomId = roomId,
            PlayerId = playerId,
            Score = 5,
            JoinedAt = DateTime.UtcNow.AddDays(-5)
        });

        context.GameAnswers.Add(new GameAnswer
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            QuestionId = questionId,
            PlayerId = playerId,
            OptionId = optionId,
            IsCorrect = true,
            AnsweredAtUtc = DateTime.UtcNow.AddDays(-5)
        });

        await context.SaveChangesAsync();

        var mockLogger = new Mock<ILogger<ArchiveService>>();
        var archiveService = new ArchiveService(context, mockLogger.Object);
        var historyService = new GameHistoryService(context, archiveService);

        // Act
        var result = await historyService.GetGameHistoryAsync(roomId);

        // Assert
        Assert.NotNull(result);
        Assert.False(result.IsArchived, "Recent game should not be marked as archived");
        Assert.NotNull(result.Players);
        Assert.NotNull(result.Answers);
        Assert.Null(result.Summary);
        Assert.Single(result.Answers);
        Assert.Single(result.Players);
    }

    /// <summary>
    /// Tests that archived games return summary-only data (no detailed answers).
    /// </summary>
    [Fact]
    public async Task GetGameHistoryAsync_ArchivedGame_ReturnsSummaryOnly()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<SabqDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new SabqDbContext(options);

        var playerId = Guid.NewGuid();
        var roomId = Guid.NewGuid();

        // Create test data - old room with summary
        var player = new Player { Id = playerId, DisplayName = "OldPlayer", CreatedAt = DateTime.UtcNow.AddDays(-100) };
        context.Players.Add(player);

        var room = new GameRoom
        {
            Id = roomId,
            Code = "OLDGAM",
            HostPlayerId = playerId,
            Status = RoomStatus.Finished,
            CreatedAt = DateTime.UtcNow.AddDays(-100) // Old room
        };
        context.GameRooms.Add(room);

        // Add summary (simulating archived data)
        context.GameRoomSummaries.Add(new GameRoomSummary
        {
            RoomId = roomId,
            CreatedAtUtc = room.CreatedAt,
            FinishedAtUtc = room.CreatedAt.AddHours(1),
            TotalPlayers = 3,
            TotalQuestions = 15,
            WinnerPlayerId = playerId,
            MaxScore = 10,
            IsArchived = true
        });

        context.GameRoomPlayerSummaries.Add(new GameRoomPlayerSummary
        {
            RoomId = roomId,
            PlayerId = playerId,
            Score = 10,
            AnsweredCount = 15,
            CorrectAnswers = 10,
            WrongAnswers = 5,
            CreatedAtUtc = DateTime.UtcNow
        });

        await context.SaveChangesAsync();

        var mockLogger = new Mock<ILogger<ArchiveService>>();
        var archiveService = new ArchiveService(context, mockLogger.Object);
        var historyService = new GameHistoryService(context, archiveService);

        // Act
        var result = await historyService.GetGameHistoryAsync(roomId);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsArchived, "Old game should be marked as archived");
        Assert.Null(result.Players);  // No detailed player data
        Assert.Null(result.Answers);  // No detailed answers - CRITICAL REQUIREMENT
        Assert.NotNull(result.Summary);
        Assert.Equal(3, result.Summary.TotalPlayers);
        Assert.Equal(15, result.Summary.TotalQuestions);
        Assert.Equal(10, result.Summary.MaxScore);
    }

    /// <summary>
    /// Tests that archived games NEVER return detailed answers.
    /// </summary>
    [Fact]
    public async Task GetGameHistoryAsync_ArchivedGame_NeverReturnsDetailedAnswers()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<SabqDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new SabqDbContext(options);

        var playerId = Guid.NewGuid();
        var roomId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        var optionId = Guid.NewGuid();

        var player = new Player { Id = playerId, DisplayName = "TestPlayer", CreatedAt = DateTime.UtcNow.AddDays(-100) };
        context.Players.Add(player);

        var room = new GameRoom
        {
            Id = roomId,
            Code = "NOANS",
            HostPlayerId = playerId,
            Status = RoomStatus.Finished,
            CreatedAt = DateTime.UtcNow.AddDays(-100)
        };
        context.GameRooms.Add(room);

        // Even if answers exist in hot table (edge case), they should NOT be returned for archived games
        context.GameAnswers.Add(new GameAnswer
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            QuestionId = questionId,
            PlayerId = playerId,
            OptionId = optionId,
            IsCorrect = true,
            AnsweredAtUtc = DateTime.UtcNow.AddDays(-100)
        });

        context.GameRoomSummaries.Add(new GameRoomSummary
        {
            RoomId = roomId,
            CreatedAtUtc = room.CreatedAt,
            TotalPlayers = 1,
            TotalQuestions = 1,
            MaxScore = 1,
            IsArchived = true
        });

        await context.SaveChangesAsync();

        var mockLogger = new Mock<ILogger<ArchiveService>>();
        var archiveService = new ArchiveService(context, mockLogger.Object);
        var historyService = new GameHistoryService(context, archiveService);

        // Act
        var result = await historyService.GetGameHistoryAsync(roomId);

        // Assert - CRITICAL: archived games must NEVER return detailed answers
        Assert.NotNull(result);
        Assert.True(result.IsArchived);
        Assert.Null(result.Answers); // CRITICAL - must be null for archived
        Assert.NotNull(result.Summary);
    }
}
