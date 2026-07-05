using Microsoft.AspNetCore.SignalR;
using Sabq.Api.Hubs;
using Sabq.Application.Services;
using Sabq.Shared.SignalR;
using System.Collections.Concurrent;

namespace Sabq.Api.Services;

public sealed class RoomQuestionFlow
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<SabqHub> _hubContext;
    private readonly ILogger<RoomQuestionFlow> _logger;
    private readonly ConcurrentDictionary<string, ScheduledQuestionTimer> _timers = new();

    public RoomQuestionFlow(
        IServiceScopeFactory scopeFactory,
        IHubContext<SabqHub> hubContext,
        ILogger<RoomQuestionFlow> logger)
    {
        _scopeFactory = scopeFactory;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendNextQuestionAsync(string roomCode, CancellationToken cancellationToken = default)
    {
        roomCode = roomCode.ToUpperInvariant();

        using var scope = _scopeFactory.CreateScope();
        var gameService = scope.ServiceProvider.GetRequiredService<GameService>();
        var roomService = scope.ServiceProvider.GetRequiredService<RoomService>();

        var question = await gameService.GetNextQuestionAsync(roomCode);
        if (question == null)
        {
            CancelQuestionTimer(roomCode);

            var leaderboard = await gameService.GetLeaderboardAsync(roomCode);
            await _hubContext.Clients.Group(roomCode)
                .SendAsync("GameEnded", new GameEndedEvent(leaderboard), cancellationToken);
            return;
        }

        var snapshot = await roomService.GetRoomStateAsync(roomCode);
        if (snapshot == null)
            return;

        await _hubContext.Clients.Group(roomCode)
            .SendAsync(
                "NewQuestion",
                new NewQuestionEvent(question, snapshot.CurrentQuestionIndex + 1, snapshot.QuestionIds.Count),
                cancellationToken);

        ScheduleQuestionTimeout(roomCode, question.Id, TimeSpan.FromSeconds(question.TimeLimitSec + 2));
    }

    public async Task EndQuestionAsync(
        string roomCode,
        Guid questionId,
        CancellationToken cancellationToken = default)
    {
        roomCode = roomCode.ToUpperInvariant();

        using var scope = _scopeFactory.CreateScope();
        var gameService = scope.ServiceProvider.GetRequiredService<GameService>();

        var questionEnded = await gameService.EndCurrentQuestionAsync(roomCode, questionId);
        if (!questionEnded)
            return;

        CancelQuestionTimer(roomCode);

        var correctOptionId = await gameService.GetCorrectOptionIdAsync(questionId);
        var leaderboard = await gameService.GetLeaderboardAsync(roomCode);

        await _hubContext.Clients.Group(roomCode)
            .SendAsync("QuestionEnded", new QuestionEndedEvent(correctOptionId, leaderboard), cancellationToken);

        await Task.Delay(TimeSpan.FromSeconds(3), cancellationToken);
        await SendNextQuestionAsync(roomCode, cancellationToken);
    }

    private void ScheduleQuestionTimeout(string roomCode, Guid questionId, TimeSpan delay)
    {
        var timer = new ScheduledQuestionTimer(questionId);
        _timers.AddOrUpdate(
            roomCode,
            timer,
            (_, existing) =>
            {
                existing.Cancel();
                return timer;
            });

        _ = RunQuestionTimerAsync(roomCode, timer, delay);
    }

    private void CancelQuestionTimer(string roomCode)
    {
        if (_timers.TryRemove(roomCode, out var timer))
            timer.Cancel();
    }

    private async Task RunQuestionTimerAsync(string roomCode, ScheduledQuestionTimer timer, TimeSpan delay)
    {
        try
        {
            await Task.Delay(delay, timer.CancellationToken);
            await EndQuestionAsync(roomCode, timer.QuestionId);
        }
        catch (OperationCanceledException)
        {
            // Expected when the question ends early.
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Question timer failed for room {RoomCode}", roomCode);
        }
        finally
        {
            if (_timers.TryGetValue(roomCode, out var current) && ReferenceEquals(current, timer))
                _timers.TryRemove(roomCode, out _);

            timer.Dispose();
        }
    }

    private sealed class ScheduledQuestionTimer : IDisposable
    {
        private readonly CancellationTokenSource _cancellationTokenSource = new();
        private bool _disposed;

        public ScheduledQuestionTimer(Guid questionId)
        {
            QuestionId = questionId;
        }

        public Guid QuestionId { get; }

        public CancellationToken CancellationToken => _cancellationTokenSource.Token;

        public void Cancel()
        {
            if (_disposed)
                return;

            try
            {
                _cancellationTokenSource.Cancel();
            }
            catch (ObjectDisposedException)
            {
                // A timer can finish at the same moment another caller tries to cancel it.
            }
        }

        public void Dispose()
        {
            _disposed = true;
            _cancellationTokenSource.Dispose();
        }
    }
}
