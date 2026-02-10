using Microsoft.EntityFrameworkCore;
using Sabq.Domain.Entities;
using Sabq.Domain.Enums;
using Sabq.Infrastructure.Data;
using Sabq.Infrastructure.RoomState;
using Sabq.Shared.DTOs;
using System.Text.Json;

namespace Sabq.Application.Services;

public class GameService
{
    private readonly SabqDbContext _context;
    private readonly IRoomStore _roomStore;
    private readonly Dictionary<string, SemaphoreSlim> _roomLocks = new();
    private readonly SemaphoreSlim _lockCreationLock = new(1, 1);

    public GameService(SabqDbContext context, IRoomStore roomStore)
    {
        _context = context;
        _roomStore = roomStore;
    }

    public async Task<List<QuestionDto>> StartGameAsync(string roomCode, Guid hostPlayerId)
    {
        var snapshot = await _roomStore.GetRoomAsync(roomCode);
        if (snapshot == null)
            throw new InvalidOperationException("Room not found");

        if (snapshot.HostPlayerId != hostPlayerId)
            throw new UnauthorizedAccessException("Only host can start the game");

        if (snapshot.Status != RoomStatus.Lobby)
            throw new InvalidOperationException("Game already started");

        // Get settings
        var room = await _context.GameRooms.FirstAsync(r => r.Code == roomCode);
        var settings = JsonSerializer.Deserialize<CreateRoomRequest>(room.SettingsJson ?? "{}");
        if (settings == null)
            throw new InvalidOperationException("Invalid room settings");

        // Select random questions
        var questions = await _context.Questions
            .Include(q => q.Options)
            .Where(q => q.IsActive &&
                        settings.CategoryIds.Contains(q.CategoryId) &&
                        settings.Difficulties.Contains(q.Difficulty))
            .OrderBy(_ => Guid.NewGuid())
            .Take(settings.QuestionCount)
            .ToListAsync();

        if (questions.Count == 0)
            throw new InvalidOperationException("No questions available for selected criteria");

        // Save questions to database
        for (int i = 0; i < questions.Count; i++)
        {
            _context.GameRoomQuestions.Add(new GameRoomQuestion
            {
                RoomId = snapshot.RoomId,
                QuestionId = questions[i].Id,
                OrderIndex = i
            });
        }

        // Update room status
        room.Status = RoomStatus.Running;
        await _context.SaveChangesAsync();

        // Update room state
        snapshot.Status = RoomStatus.Running;
        snapshot.QuestionIds = questions.Select(q => q.Id).ToList();
        snapshot.CurrentQuestionIndex = -1; // Will be incremented to 0 when next question is sent

        await _roomStore.SaveRoomAsync(snapshot);

        return questions.Select(q => new QuestionDto
        {
            Id = q.Id,
            TextAr = q.TextAr,
            Difficulty = q.Difficulty,
            TimeLimitSec = q.TimeLimitSec,
            Options = q.Options.Select(o => new OptionDto
            {
                Id = o.Id,
                TextAr = o.TextAr,
                IsCorrect = null // Don't send correct answer
            }).ToList()
        }).ToList();
    }

    public async Task<QuestionDto?> GetNextQuestionAsync(string roomCode)
    {
        var snapshot = await _roomStore.GetRoomAsync(roomCode);
        if (snapshot == null)
            return null;

        snapshot.CurrentQuestionIndex++;
        if (snapshot.CurrentQuestionIndex >= snapshot.QuestionIds.Count)
        {
            // Game finished
            snapshot.Status = RoomStatus.Finished;
            await _roomStore.SaveRoomAsync(snapshot);

            var room = await _context.GameRooms.FirstAsync(r => r.Code == roomCode);
            room.Status = RoomStatus.Finished;
            await _context.SaveChangesAsync();

            return null;
        }

        var questionId = snapshot.QuestionIds[snapshot.CurrentQuestionIndex];
        snapshot.CurrentQuestionId = questionId;
        snapshot.PlayersAnsweredCurrentQuestion.Clear();
        snapshot.QuestionStartedAt = DateTime.UtcNow;

        await _roomStore.SaveRoomAsync(snapshot);

        var question = await _context.Questions
            .Include(q => q.Options)
            .FirstAsync(q => q.Id == questionId);

        return new QuestionDto
        {
            Id = question.Id,
            TextAr = question.TextAr,
            Difficulty = question.Difficulty,
            TimeLimitSec = question.TimeLimitSec,
            Options = question.Options.Select(o => new OptionDto
            {
                Id = o.Id,
                TextAr = o.TextAr,
                IsCorrect = null
            }).ToList()
        };
    }

    public async Task<QuestionDto?> GetCurrentQuestionAsync(Guid questionId)
    {
        var question = await _context.Questions
            .Include(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == questionId);

        if (question == null)
            return null;

        return new QuestionDto
        {
            Id = question.Id,
            TextAr = question.TextAr,
            Difficulty = question.Difficulty,
            TimeLimitSec = question.TimeLimitSec,
            Options = question.Options.Select(o => new OptionDto
            {
                Id = o.Id,
                TextAr = o.TextAr,
                IsCorrect = null
            }).ToList()
        };
    }

    public async Task<(bool IsCorrect, int DeltaScore, int UpdatedScore, bool IsFirstCorrect, bool AllPlayersAnsweredWrong)> SubmitAnswerAsync(
        string roomCode, Guid questionId, Guid playerId, Guid optionId)
    {
        var lockObj = await GetRoomLockAsync(roomCode);
        await lockObj.WaitAsync();

        try
        {
            var snapshot = await _roomStore.GetRoomAsync(roomCode);
            if (snapshot == null)
                throw new InvalidOperationException("Room not found");

            if (snapshot.CurrentQuestionId != questionId)
                throw new InvalidOperationException("Question not current");

            if (snapshot.PlayersAnsweredCurrentQuestion.Contains(playerId))
                throw new InvalidOperationException("Player already answered");

            // Mark player as answered
            snapshot.PlayersAnsweredCurrentQuestion.Add(playerId);

            // Check if answer is correct
            var option = await _context.Options.FindAsync(optionId);
            if (option == null)
                throw new InvalidOperationException("Option not found");

            bool isCorrect = option.IsCorrect;
            bool isFirstCorrect = false;
            bool allPlayersAnsweredWrong = false;
            int deltaScore = 0;

            if (isCorrect)
            {
                // Check if this is the first correct answer
                var existingCorrectAnswers = await _context.GameAnswers
                    .Where(a => a.RoomId == snapshot.RoomId &&
                               a.QuestionId == questionId &&
                               a.IsCorrect)
                    .AnyAsync();

                isFirstCorrect = !existingCorrectAnswers;
                deltaScore = isFirstCorrect ? 1 : 0;
            }
            else
            {
                deltaScore = -1;
                
                // Check if all players have answered and all are wrong
                int totalPlayers = snapshot.Players.Count;
                int answeredCount = snapshot.PlayersAnsweredCurrentQuestion.Count;
                
                if (answeredCount >= totalPlayers)
                {
                    // Check if any correct answers exist for this question
                    var anyCorrectAnswer = await _context.GameAnswers
                        .Where(a => a.RoomId == snapshot.RoomId &&
                                   a.QuestionId == questionId &&
                                   a.IsCorrect)
                        .AnyAsync();
                    
                    allPlayersAnsweredWrong = !anyCorrectAnswer;
                }
            }

            // Update score
            var player = snapshot.Players[playerId];
            player.Score += deltaScore;

            // Save answer
            _context.GameAnswers.Add(new GameAnswer
            {
                Id = Guid.NewGuid(),
                RoomId = snapshot.RoomId,
                QuestionId = questionId,
                PlayerId = playerId,
                OptionId = optionId,
                IsCorrect = isCorrect,
                AnsweredAtUtc = DateTime.UtcNow
            });

            // Update database score
            var roomPlayer = await _context.GameRoomPlayers
                .FirstAsync(rp => rp.RoomId == snapshot.RoomId && rp.PlayerId == playerId);
            roomPlayer.Score = player.Score;

            await _context.SaveChangesAsync();
            await _roomStore.SaveRoomAsync(snapshot);

            return (isCorrect, deltaScore, player.Score, isFirstCorrect, allPlayersAnsweredWrong);
        }
        finally
        {
            lockObj.Release();
        }
    }

    public async Task<List<PlayerDto>> GetLeaderboardAsync(string roomCode)
    {
        var snapshot = await _roomStore.GetRoomAsync(roomCode);
        if (snapshot == null)
            return new List<PlayerDto>();

        return snapshot.Players.Values
            .OrderByDescending(p => p.Score)
            .ThenBy(p => p.DisplayName)
            .ToList();
    }

    public async Task<Guid> GetCorrectOptionIdAsync(Guid questionId)
    {
        var correctOption = await _context.Options
            .FirstAsync(o => o.QuestionId == questionId && o.IsCorrect);
        return correctOption.Id;
    }

    private async Task<SemaphoreSlim> GetRoomLockAsync(string roomCode)
    {
        await _lockCreationLock.WaitAsync();
        try
        {
            if (!_roomLocks.ContainsKey(roomCode))
            {
                _roomLocks[roomCode] = new SemaphoreSlim(1, 1);
            }
            return _roomLocks[roomCode];
        }
        finally
        {
            _lockCreationLock.Release();
        }
    }
}
