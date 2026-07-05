using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Sabq.Application.Services;
using Sabq.Domain.Entities;
using Sabq.Domain.Enums;
using Sabq.Infrastructure.Data;
using Sabq.Infrastructure.RoomState;
using Sabq.Shared.DTOs;
using Xunit;

namespace Sabq.Tests;

public class RoomLifecycleServiceTests
{
    [Fact]
    public async Task CleanupStaleRoomsAsync_AbandonsOldLobbyRooms()
    {
        var options = CreateInMemoryOptions();
        await using var context = new SabqDbContext(options);
        var roomStore = new InMemoryRoomStore();
        var nowUtc = DateTime.UtcNow;
        var room = CreateRoom("OLDLOB", RoomStatus.Lobby, nowUtc.AddHours(-2));
        context.GameRooms.Add(room);
        await context.SaveChangesAsync();

        await roomStore.SaveRoomAsync(CreateSnapshot(room));
        var service = CreateService(context, roomStore);

        var result = await service.CleanupStaleRoomsAsync(TimeSpan.FromHours(1), TimeSpan.FromMinutes(30));

        await context.Entry(room).ReloadAsync();
        Assert.Equal(1, result.AbandonedLobbyRooms);
        Assert.Equal(RoomStatus.Abandoned, room.Status);
        Assert.NotNull(room.FinishedAtUtc);
        Assert.Null(await roomStore.GetRoomAsync(room.Code));
    }

    [Fact]
    public async Task CleanupStaleRoomsAsync_AbandonsRunningRoomsWithMissingState()
    {
        var options = CreateInMemoryOptions();
        await using var context = new SabqDbContext(options);
        var roomStore = new InMemoryRoomStore();
        var nowUtc = DateTime.UtcNow;
        var room = CreateRoom("MISSNG", RoomStatus.Running, nowUtc.AddMinutes(-5));
        context.GameRooms.Add(room);
        await context.SaveChangesAsync();

        var service = CreateService(context, roomStore);

        var result = await service.CleanupStaleRoomsAsync(TimeSpan.FromHours(1), TimeSpan.FromMinutes(30));

        await context.Entry(room).ReloadAsync();
        Assert.Equal(1, result.AbandonedRunningRooms);
        Assert.Equal(RoomStatus.Abandoned, room.Status);
        Assert.NotNull(room.FinishedAtUtc);
    }

    [Fact]
    public async Task CleanupStaleRoomsAsync_KeepsRecentRoomsWithState()
    {
        var options = CreateInMemoryOptions();
        await using var context = new SabqDbContext(options);
        var roomStore = new InMemoryRoomStore();
        var nowUtc = DateTime.UtcNow;
        var room = CreateRoom("RECENT", RoomStatus.Running, nowUtc.AddMinutes(-5));
        context.GameRooms.Add(room);
        await context.SaveChangesAsync();
        await roomStore.SaveRoomAsync(CreateSnapshot(room));

        var service = CreateService(context, roomStore);

        var result = await service.CleanupStaleRoomsAsync(TimeSpan.FromHours(1), TimeSpan.FromMinutes(30));

        await context.Entry(room).ReloadAsync();
        Assert.Equal(0, result.AbandonedRunningRooms);
        Assert.Equal(RoomStatus.Running, room.Status);
    }

    private static DbContextOptions<SabqDbContext> CreateInMemoryOptions()
    {
        return new DbContextOptionsBuilder<SabqDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    private static RoomLifecycleService CreateService(SabqDbContext context, InMemoryRoomStore roomStore)
    {
        return new RoomLifecycleService(
            context,
            roomStore,
            NullLogger<RoomLifecycleService>.Instance);
    }

    private static GameRoom CreateRoom(string code, RoomStatus status, DateTime lastActivityUtc)
    {
        return new GameRoom
        {
            Id = Guid.NewGuid(),
            Code = code,
            HostPlayerId = Guid.NewGuid(),
            Status = status,
            CreatedAt = lastActivityUtc,
            LastActivityAtUtc = lastActivityUtc,
            CurrentQuestionIndex = status == RoomStatus.Running ? 0 : null,
            CurrentQuestionId = status == RoomStatus.Running ? Guid.NewGuid() : null,
            QuestionStartedAtUtc = status == RoomStatus.Running ? lastActivityUtc : null
        };
    }

    private static RoomStateSnapshot CreateSnapshot(GameRoom room)
    {
        return new RoomStateSnapshot
        {
            RoomCode = room.Code,
            RoomId = room.Id,
            HostPlayerId = room.HostPlayerId,
            Status = room.Status,
            CurrentQuestionIndex = room.CurrentQuestionIndex ?? -1,
            CurrentQuestionId = room.CurrentQuestionId,
            QuestionStartedAt = room.QuestionStartedAtUtc,
            LastActivityAtUtc = room.LastActivityAtUtc,
            Players = new Dictionary<Guid, PlayerDto>
            {
                [room.HostPlayerId] = new PlayerDto
                {
                    Id = room.HostPlayerId,
                    DisplayName = "Host",
                    Score = 0
                }
            }
        };
    }
}
