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
/// Tests for archive and summary functionality.
/// </summary>
public class ArchiveServiceTests
{
    /// <summary>
    /// Tests that cutoff calculation returns correct date.
    /// </summary>
    [Theory]
    [InlineData(90)]
    [InlineData(30)]
    [InlineData(180)]
    public void CalculateCutoffDate_ReturnsCorrectDate(int retentionDays)
    {
        // Arrange & Act
        var before = DateTime.UtcNow.AddDays(-retentionDays);
        var cutoff = ArchiveService.CalculateCutoffDate(retentionDays);
        var after = DateTime.UtcNow.AddDays(-retentionDays);

        // Assert
        Assert.True(cutoff >= before && cutoff <= after, 
            $"Cutoff {cutoff} should be between {before} and {after}");
    }

    /// <summary>
    /// Tests that default retention is 90 days.
    /// </summary>
    [Fact]
    public void CalculateCutoffDate_Default_Is90Days()
    {
        // Arrange & Act
        var cutoff = ArchiveService.CalculateCutoffDate();
        var expected = DateTime.UtcNow.AddDays(-90);

        // Assert
        var diff = Math.Abs((cutoff - expected).TotalSeconds);
        Assert.True(diff < 5, "Default cutoff should be approximately 90 days ago");
    }

    /// <summary>
    /// Tests that rooms older than cutoff are identified as archived.
    /// </summary>
    [Fact]
    public async Task IsRoomArchivedAsync_OldRoom_ReturnsTrue()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<SabqDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new SabqDbContext(options);
        
        var roomId = Guid.NewGuid();
        var oldRoom = new GameRoom
        {
            Id = roomId,
            Code = "TEST01",
            HostPlayerId = Guid.NewGuid(),
            Status = RoomStatus.Finished,
            CreatedAt = DateTime.UtcNow.AddDays(-100) // Older than 90 days
        };
        context.GameRooms.Add(oldRoom);
        await context.SaveChangesAsync();

        var mockLogger = new Mock<ILogger<ArchiveService>>();
        var service = new ArchiveService(context, mockLogger.Object);

        // Act
        var isArchived = await service.IsRoomArchivedAsync(roomId);

        // Assert
        Assert.True(isArchived, "Room older than 90 days should be considered archived");
    }

    /// <summary>
    /// Tests that recent rooms are not identified as archived.
    /// </summary>
    [Fact]
    public async Task IsRoomArchivedAsync_RecentRoom_ReturnsFalse()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<SabqDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new SabqDbContext(options);
        
        var roomId = Guid.NewGuid();
        var recentRoom = new GameRoom
        {
            Id = roomId,
            Code = "TEST02",
            HostPlayerId = Guid.NewGuid(),
            Status = RoomStatus.Finished,
            CreatedAt = DateTime.UtcNow.AddDays(-10) // Recent room
        };
        context.GameRooms.Add(recentRoom);
        await context.SaveChangesAsync();

        var mockLogger = new Mock<ILogger<ArchiveService>>();
        var service = new ArchiveService(context, mockLogger.Object);

        // Act
        var isArchived = await service.IsRoomArchivedAsync(roomId);

        // Assert
        Assert.False(isArchived, "Room newer than 90 days should not be considered archived");
    }

    /// <summary>
    /// Tests that explicitly archived rooms are identified correctly.
    /// </summary>
    [Fact]
    public async Task IsRoomArchivedAsync_ExplicitlyArchivedRoom_ReturnsTrue()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<SabqDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new SabqDbContext(options);
        
        var roomId = Guid.NewGuid();
        
        // Room is technically recent but has been explicitly archived
        var room = new GameRoom
        {
            Id = roomId,
            Code = "TEST03",
            HostPlayerId = Guid.NewGuid(),
            Status = RoomStatus.Finished,
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        };
        context.GameRooms.Add(room);

        var summary = new GameRoomSummary
        {
            RoomId = roomId,
            CreatedAtUtc = room.CreatedAt,
            TotalPlayers = 2,
            TotalQuestions = 10,
            MaxScore = 5,
            IsArchived = true // Explicitly marked as archived
        };
        context.GameRoomSummaries.Add(summary);
        await context.SaveChangesAsync();

        var mockLogger = new Mock<ILogger<ArchiveService>>();
        var service = new ArchiveService(context, mockLogger.Object);

        // Act
        var isArchived = await service.IsRoomArchivedAsync(roomId);

        // Assert
        Assert.True(isArchived, "Explicitly archived room should be identified as archived");
    }
}
