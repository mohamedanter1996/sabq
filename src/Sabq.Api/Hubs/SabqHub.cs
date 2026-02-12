using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Sabq.Application.Services;
using Sabq.Shared.SignalR;
using System.Security.Claims;

namespace Sabq.Api.Hubs;

[Authorize]
public class SabqHub : Hub
{
    private readonly RoomService _roomService;
    private readonly GameService _gameService;

    public SabqHub(RoomService roomService, GameService gameService)
    {
        _roomService = roomService;
        _gameService = gameService;
    }

    public async Task JoinRoom(string roomCode)
    {
        var playerId = GetPlayerId();
        if (playerId == null)
            return;

        roomCode = roomCode.ToUpper();

        var snapshot = await _roomService.GetRoomStateAsync(roomCode);
        if (snapshot == null)
            return;

        await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);

        // Send current snapshot to the joining player
        await Clients.Caller.SendAsync("RoomSnapshot", new RoomSnapshot
        {
            RoomCode = snapshot.RoomCode,
            Status = snapshot.Status,
            HostPlayerId = snapshot.HostPlayerId,
            Players = snapshot.Players.Values.ToList(),
            TotalQuestions = snapshot.QuestionIds.Count,
            CurrentQuestionIndex = snapshot.CurrentQuestionIndex
        });

        // If game is running, send the current question to this player
        if (snapshot.Status == Sabq.Domain.Enums.RoomStatus.Running && snapshot.CurrentQuestionId.HasValue)
        {
            var question = await _gameService.GetCurrentQuestionAsync(snapshot.CurrentQuestionId.Value);
            if (question != null)
            {
                // Calculate remaining time based on when question started
                var remainingSeconds = question.TimeLimitSec;
                if (snapshot.QuestionStartedAt.HasValue)
                {
                    var elapsedSeconds = (int)(DateTime.UtcNow - snapshot.QuestionStartedAt.Value).TotalSeconds;
                    remainingSeconds = Math.Max(1, question.TimeLimitSec - elapsedSeconds);
                }
                
                // Check if player already answered this question
                var hasAlreadyAnswered = snapshot.PlayersAnsweredCurrentQuestion.Contains(playerId.Value);
                
                // Get selected option if player already answered
                Guid? selectedOptionId = null;
                if (hasAlreadyAnswered && snapshot.PlayerSelectedOptions.TryGetValue(playerId.Value, out var optId))
                {
                    selectedOptionId = optId;
                }
                
                // Create a modified question with remaining time
                var questionWithRemainingTime = new Sabq.Shared.DTOs.QuestionDto
                {
                    Id = question.Id,
                    TextAr = question.TextAr,
                    Difficulty = question.Difficulty,
                    TimeLimitSec = remainingSeconds,
                    Options = question.Options
                };
                
                await Clients.Caller.SendAsync("NewQuestion",
                    new NewQuestionEvent(questionWithRemainingTime, snapshot.CurrentQuestionIndex + 1, snapshot.QuestionIds.Count, hasAlreadyAnswered, selectedOptionId));
                
                // Send current leaderboard
                var leaderboard = await _gameService.GetLeaderboardAsync(roomCode);
                await Clients.Caller.SendAsync("ScoresUpdated", new ScoresUpdatedEvent(leaderboard));
            }
        }

        // Notify others if player just joined (not reconnecting)
        if (snapshot.Players.ContainsKey(playerId.Value))
        {
            var player = snapshot.Players[playerId.Value];
            await Clients.OthersInGroup(roomCode).SendAsync("PlayerJoined", new PlayerJoinedEvent(player));
        }
    }

    public async Task LeaveRoom(string roomCode)
    {
        roomCode = roomCode.ToUpper();
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomCode);
    }

    public async Task StartGame(string roomCode)
    {
        var playerId = GetPlayerId();
        if (playerId == null)
            return;

        roomCode = roomCode.ToUpper();

        try
        {
            var questions = await _gameService.StartGameAsync(roomCode, playerId.Value);

            // Notify all players
            await Clients.Group(roomCode).SendAsync("GameStarted", new GameStartedEvent(questions.Count));

            // Start sending questions
            await SendNextQuestion(roomCode);
        }
        catch
        {
            // Errors already handled in controller
        }
    }

    public async Task SubmitAnswer(string roomCode, Guid questionId, Guid optionId)
    {
        var playerId = GetPlayerId();
        if (playerId == null)
            return;

        roomCode = roomCode.ToUpper();

        try
        {
            var (isCorrect, deltaScore, updatedScore, isFirstCorrect, allPlayersAnsweredWrong) =
                await _gameService.SubmitAnswerAsync(roomCode, questionId, playerId.Value, optionId);

            // Notify the player of their result
            await Clients.Caller.SendAsync("AnswerResult",
                new AnswerResultEvent(playerId.Value, isCorrect, deltaScore, updatedScore));

            // Broadcast updated scores
            var leaderboard = await _gameService.GetLeaderboardAsync(roomCode);
            await Clients.Group(roomCode).SendAsync("ScoresUpdated", new ScoresUpdatedEvent(leaderboard));

            // If first correct answer, immediately lock the question for all players
            if (isFirstCorrect)
            {
                var snapshot = await _roomService.GetRoomStateAsync(roomCode);
                var playerName = snapshot?.Players[playerId.Value].DisplayName ?? "لاعب";
                await Clients.Group(roomCode).SendAsync("QuestionLocked", 
                    new QuestionLockedEvent(playerId.Value, playerName));
                await Task.Delay(2000); // Show who answered correctly
                await EndCurrentQuestion(roomCode, questionId);
            }
            else if (allPlayersAnsweredWrong)
            {
                await Task.Delay(1000);
                await EndCurrentQuestion(roomCode, questionId);
            }
        }
        catch (InvalidOperationException ex)
        {
            await Clients.Caller.SendAsync("Error", ex.Message);
        }
    }

    public async Task EndQuestion(string roomCode, Guid questionId)
    {
        var playerId = GetPlayerId();
        if (playerId == null)
            return;

        roomCode = roomCode.ToUpper();

        var snapshot = await _roomService.GetRoomStateAsync(roomCode);
        if (snapshot == null || snapshot.HostPlayerId != playerId.Value)
            return;

        await EndCurrentQuestion(roomCode, questionId);
    }

    private async Task EndCurrentQuestion(string roomCode, Guid questionId)
    {
        var correctOptionId = await _gameService.GetCorrectOptionIdAsync(questionId);
        var leaderboard = await _gameService.GetLeaderboardAsync(roomCode);

        await Clients.Group(roomCode).SendAsync("QuestionEnded",
            new QuestionEndedEvent(correctOptionId, leaderboard));

        // Wait a bit before sending next question or ending game
        await Task.Delay(3000);
        await SendNextQuestion(roomCode);
    }

    private async Task SendNextQuestion(string roomCode)
    {
        var question = await _gameService.GetNextQuestionAsync(roomCode);

        if (question == null)
        {
            // Game ended
            var leaderboard = await _gameService.GetLeaderboardAsync(roomCode);
            await Clients.Group(roomCode).SendAsync("GameEnded", new GameEndedEvent(leaderboard));
            return;
        }

        var snapshot = await _roomService.GetRoomStateAsync(roomCode);
        if (snapshot == null)
            return;

        await Clients.Group(roomCode).SendAsync("NewQuestion",
            new NewQuestionEvent(question, snapshot.CurrentQuestionIndex + 1, snapshot.QuestionIds.Count));

        // Auto-end question after time limit + buffer
        _ = Task.Run(async () =>
        {
            await Task.Delay((question.TimeLimitSec + 2) * 1000);

            // Check if question is still current
            var currentSnapshot = await _roomService.GetRoomStateAsync(roomCode);
            if (currentSnapshot?.CurrentQuestionId == question.Id)
            {
                await EndCurrentQuestion(roomCode, question.Id);
            }
        });
    }

    private Guid? GetPlayerId()
    {
        var claim = Context.User?.FindFirst(ClaimTypes.NameIdentifier);
        if (claim == null)
            return null;

        return Guid.TryParse(claim.Value, out var id) ? id : null;
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
