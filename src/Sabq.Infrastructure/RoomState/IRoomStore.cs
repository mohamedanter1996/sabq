namespace Sabq.Infrastructure.RoomState;

public interface IRoomStore
{
    Task<RoomStateSnapshot?> GetRoomAsync(string roomCode);
    Task SaveRoomAsync(RoomStateSnapshot snapshot);
    Task DeleteRoomAsync(string roomCode);
    Task<bool> RoomExistsAsync(string roomCode);
}
