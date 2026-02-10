using StackExchange.Redis;
using System.Text.Json;

namespace Sabq.Infrastructure.RoomState;

public class RedisRoomStore : IRoomStore
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _db;

    public RedisRoomStore(IConnectionMultiplexer redis)
    {
        _redis = redis;
        _db = redis.GetDatabase();
    }

    private static string GetKey(string roomCode) => $"room:{roomCode}";

    public async Task<RoomStateSnapshot?> GetRoomAsync(string roomCode)
    {
        var json = await _db.StringGetAsync(GetKey(roomCode));
        if (json.IsNullOrEmpty)
            return null;

        return JsonSerializer.Deserialize<RoomStateSnapshot>(json!);
    }

    public async Task SaveRoomAsync(RoomStateSnapshot snapshot)
    {
        var json = JsonSerializer.Serialize(snapshot);
        await _db.StringSetAsync(GetKey(snapshot.RoomCode), json, TimeSpan.FromHours(24));
    }

    public async Task DeleteRoomAsync(string roomCode)
    {
        await _db.KeyDeleteAsync(GetKey(roomCode));
    }

    public async Task<bool> RoomExistsAsync(string roomCode)
    {
        return await _db.KeyExistsAsync(GetKey(roomCode));
    }
}
