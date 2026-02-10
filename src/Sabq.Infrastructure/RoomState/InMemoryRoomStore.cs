using System.Collections.Concurrent;

namespace Sabq.Infrastructure.RoomState;

public class InMemoryRoomStore : IRoomStore
{
    private readonly ConcurrentDictionary<string, RoomStateSnapshot> _rooms = new();

    public Task<RoomStateSnapshot?> GetRoomAsync(string roomCode)
    {
        _rooms.TryGetValue(roomCode, out var snapshot);
        return Task.FromResult(snapshot);
    }

    public Task SaveRoomAsync(RoomStateSnapshot snapshot)
    {
        _rooms[snapshot.RoomCode] = snapshot;
        return Task.CompletedTask;
    }

    public Task DeleteRoomAsync(string roomCode)
    {
        _rooms.TryRemove(roomCode, out _);
        return Task.CompletedTask;
    }

    public Task<bool> RoomExistsAsync(string roomCode)
    {
        return Task.FromResult(_rooms.ContainsKey(roomCode));
    }
}
