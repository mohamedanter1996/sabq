using Microsoft.EntityFrameworkCore;
using Sabq.Domain.Entities;
using Sabq.Domain.Enums;
using Sabq.Infrastructure.Data;
using Sabq.Infrastructure.RoomState;
using Sabq.Shared.DTOs;
using Sabq.Shared.SignalR;
using System.Text.Json;

namespace Sabq.Application.Services;

public class RoomService
{
    private readonly SabqDbContext _context;
    private readonly IRoomStore _roomStore;
    private static readonly Random _random = new();

    public RoomService(SabqDbContext context, IRoomStore roomStore)
    {
        _context = context;
        _roomStore = roomStore;
    }

    public async Task<CreateRoomResponse> CreateRoomAsync(CreateRoomRequest request, Guid hostPlayerId)
    {
        // Generate unique room code
        string roomCode;
        do
        {
            roomCode = GenerateRoomCode();
        } while (await _roomStore.RoomExistsAsync(roomCode));

        // Create room in database
        var room = new GameRoom
        {
            Id = Guid.NewGuid(),
            Code = roomCode,
            HostPlayerId = hostPlayerId,
            Status = RoomStatus.Lobby,
            SettingsJson = JsonSerializer.Serialize(request),
            CreatedAt = DateTime.UtcNow
        };

        _context.GameRooms.Add(room);

        // Add host as first player
        var hostPlayer = await _context.Players.FindAsync(hostPlayerId);
        if (hostPlayer == null)
            throw new InvalidOperationException("Host player not found");

        var roomPlayer = new GameRoomPlayer
        {
            RoomId = room.Id,
            PlayerId = hostPlayerId,
            Score = 0,
            JoinedAt = DateTime.UtcNow
        };
        _context.GameRoomPlayers.Add(roomPlayer);

        await _context.SaveChangesAsync();

        // Initialize room state
        var snapshot = new RoomStateSnapshot
        {
            RoomCode = roomCode,
            RoomId = room.Id,
            HostPlayerId = hostPlayerId,
            Status = RoomStatus.Lobby,
            Players = new Dictionary<Guid, PlayerDto>
            {
                [hostPlayerId] = new PlayerDto
                {
                    Id = hostPlayerId,
                    DisplayName = hostPlayer.DisplayName,
                    Score = 0
                }
            }
        };

        await _roomStore.SaveRoomAsync(snapshot);

        return new CreateRoomResponse(roomCode);
    }

    public async Task<RoomSnapshot?> JoinRoomAsync(string roomCode, Guid playerId)
    {
        var snapshot = await _roomStore.GetRoomAsync(roomCode);
        if (snapshot == null)
            return null;

        if (snapshot.Status != RoomStatus.Lobby)
            throw new InvalidOperationException("Room is not in lobby state");

        if (snapshot.Players.ContainsKey(playerId))
            return ToRoomSnapshot(snapshot);

        // Add player to database
        var roomPlayer = new GameRoomPlayer
        {
            RoomId = snapshot.RoomId,
            PlayerId = playerId,
            Score = 0,
            JoinedAt = DateTime.UtcNow
        };
        _context.GameRoomPlayers.Add(roomPlayer);
        await _context.SaveChangesAsync();

        // Add player to room state
        var player = await _context.Players.FindAsync(playerId);
        if (player == null)
            throw new InvalidOperationException("Player not found");

        snapshot.Players[playerId] = new PlayerDto
        {
            Id = playerId,
            DisplayName = player.DisplayName,
            Score = 0
        };

        await _roomStore.SaveRoomAsync(snapshot);

        return ToRoomSnapshot(snapshot);
    }

    public async Task<RoomStateSnapshot?> GetRoomStateAsync(string roomCode)
    {
        return await _roomStore.GetRoomAsync(roomCode);
    }

    private static string GenerateRoomCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        return new string(Enumerable.Range(0, 6)
            .Select(_ => chars[_random.Next(chars.Length)])
            .ToArray());
    }

    private static RoomSnapshot ToRoomSnapshot(RoomStateSnapshot state)
    {
        return new RoomSnapshot
        {
            RoomCode = state.RoomCode,
            Status = state.Status,
            HostPlayerId = state.HostPlayerId,
            Players = state.Players.Values.ToList(),
            TotalQuestions = state.QuestionIds.Count,
            CurrentQuestionIndex = state.CurrentQuestionIndex
        };
    }
}
