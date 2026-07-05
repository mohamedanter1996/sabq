using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Sabq.Domain.Entities;
using Sabq.Domain.Enums;
using Sabq.Infrastructure.Data;
using Sabq.Infrastructure.RoomState;

namespace Sabq.Application.Services;

public sealed class RoomLifecycleService
{
    private readonly SabqDbContext _context;
    private readonly IRoomStore _roomStore;
    private readonly ILogger<RoomLifecycleService> _logger;

    public RoomLifecycleService(
        SabqDbContext context,
        IRoomStore roomStore,
        ILogger<RoomLifecycleService>? logger = null)
    {
        _context = context;
        _roomStore = roomStore;
        _logger = logger ?? NullLogger<RoomLifecycleService>.Instance;
    }

    public async Task<RoomLifecycleCleanupResult> CleanupStaleRoomsAsync(
        TimeSpan lobbyTimeout,
        TimeSpan runningStaleTimeout,
        CancellationToken cancellationToken = default)
    {
        var nowUtc = DateTime.UtcNow;
        var lobbyCutoffUtc = nowUtc.Subtract(lobbyTimeout);
        var runningCutoffUtc = nowUtc.Subtract(runningStaleTimeout);

        var candidates = await _context.GameRooms
            .Where(room => room.Status == RoomStatus.Lobby || room.Status == RoomStatus.Running)
            .OrderBy(room => room.CreatedAt)
            .ToListAsync(cancellationToken);

        var abandonedLobbyRooms = 0;
        var abandonedRunningRooms = 0;

        foreach (var room in candidates)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var snapshot = await _roomStore.GetRoomAsync(room.Code);
            var lastActivityUtc = GetLastActivityUtc(room);
            var missingState = snapshot == null;
            var timedOut = room.Status == RoomStatus.Lobby
                ? lastActivityUtc <= lobbyCutoffUtc
                : lastActivityUtc <= runningCutoffUtc;

            if (!missingState && !timedOut)
                continue;

            if (room.Status == RoomStatus.Lobby)
                abandonedLobbyRooms++;
            else
                abandonedRunningRooms++;

            room.Status = RoomStatus.Abandoned;
            room.FinishedAtUtc = nowUtc;
            room.LastActivityAtUtc = nowUtc;
            room.CurrentQuestionId = null;
            room.QuestionStartedAtUtc = null;

            if (snapshot != null)
            {
                snapshot.Status = RoomStatus.Abandoned;
                snapshot.CurrentQuestionId = null;
                snapshot.QuestionStartedAt = null;
                snapshot.LastActivityAtUtc = nowUtc;
                await _roomStore.SaveRoomAsync(snapshot);
            }

            await _roomStore.DeleteRoomAsync(room.Code);
        }

        if (abandonedLobbyRooms > 0 || abandonedRunningRooms > 0)
        {
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation(
                "Room lifecycle cleanup abandoned {LobbyCount} lobby rooms and {RunningCount} running rooms",
                abandonedLobbyRooms,
                abandonedRunningRooms);
        }

        return new RoomLifecycleCleanupResult(
            candidates.Count,
            abandonedLobbyRooms,
            abandonedRunningRooms);
    }

    private static DateTime GetLastActivityUtc(GameRoom room)
    {
        return room.LastActivityAtUtc ?? room.CreatedAt;
    }
}

public sealed record RoomLifecycleCleanupResult(
    int CheckedRooms,
    int AbandonedLobbyRooms,
    int AbandonedRunningRooms);
