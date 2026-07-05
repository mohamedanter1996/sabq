using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Sabq.Domain.Entities;
using Sabq.Domain.Enums;
using Sabq.Infrastructure.Data;
using Sabq.Infrastructure.RoomState;
using Sabq.Shared.DTOs;
using System.Collections.Concurrent;
using System.Text.Json;

namespace Sabq.Application.Services;

public class GameService
{
    private const int DefaultRepeatCooldownDays = 90;
    private const int MaxPerQuestionTypePerGame = 3;
    private static readonly string[] DerivedQuestionLeadPrefixes =
    [
        "زاوية تفكير جديدة",
        "كارت تحدي قريب الاختيارات",
        "لقطة تركيز قبل الإجابة",
        "جولة ذاكرة ومعنى",
        "اختبار معلومة من نفس العائلة",
        "دليل صغير يفرق بين الاختيارات",
        "تحدي اختيار واحد صحيح",
        "بطاقة مقارنة خفيفة",
        "سؤال يحتاج ربط مش حفظ",
        "جولة اختيارات متقاربة",
        "معلومة بسؤال له ثنية",
        "بطاقة مفيدة للعب",
        "لقطة تمييز بين إجابات قريبة",
        "تحدي سريع لكن مش مكشوف",
        "دليل من نفس المجال",
        "جولة تثبيت معلومة",
        "اختبار ربط بين clue وإجابة",
        "بطاقة تفكير للاعبين"
    ];

    private readonly SabqDbContext _context;
    private readonly IRoomStore _roomStore;
    private readonly int _repeatCooldownDays;
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> RoomLocks = new();

    public GameService(SabqDbContext context, IRoomStore roomStore, IConfiguration? configuration = null)
    {
        _context = context;
        _roomStore = roomStore;
        _repeatCooldownDays = int.TryParse(configuration?["QuestionSelection:RepeatCooldownDays"], out var configuredRepeatCooldownDays)
            ? configuredRepeatCooldownDays
            : DefaultRepeatCooldownDays;
        if (_repeatCooldownDays <= 0)
            _repeatCooldownDays = DefaultRepeatCooldownDays;
    }

    public async Task<List<QuestionDto>> StartGameAsync(string roomCode, Guid hostPlayerId)
    {
        var nowUtc = DateTime.UtcNow;
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

        var candidateQuestions = await _context.Questions
            .Include(q => q.Options)
            .Where(q => q.IsActive &&
                        settings.CategoryIds.Contains(q.CategoryId) &&
                        settings.Difficulties.Contains(q.Difficulty))
            .OrderBy(_ => Guid.NewGuid())
            .ToListAsync();

        var roomPlayerIds = snapshot.Players.Keys.ToList();
        var lastSeenQuestionFamilyDates = await GetLastSeenQuestionFamilyDatesAsync(roomPlayerIds);
        var recentCutoffUtc = DateTime.UtcNow.AddDays(-_repeatCooldownDays);
        var recentlySeenQuestionFamilyKeys = lastSeenQuestionFamilyDates
            .Where(item => item.Value >= recentCutoffUtc)
            .Select(item => item.Key)
            .ToHashSet();

        var questions = SelectQuestionsForRoom(
            candidateQuestions,
            settings.QuestionCount,
            recentlySeenQuestionFamilyKeys,
            lastSeenQuestionFamilyDates);

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
        room.StartedAtUtc = nowUtc;
        room.LastActivityAtUtc = nowUtc;
        room.CurrentQuestionIndex = -1;
        room.CurrentQuestionId = null;
        room.QuestionStartedAtUtc = null;
        await _context.SaveChangesAsync();

        // Update room state
        snapshot.Status = RoomStatus.Running;
        snapshot.QuestionIds = questions.Select(q => q.Id).ToList();
        snapshot.CurrentQuestionIndex = -1; // Will be incremented to 0 when next question is sent
        snapshot.CurrentQuestionId = null;
        snapshot.QuestionStartedAt = null;
        snapshot.LastActivityAtUtc = nowUtc;

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

    private async Task<Dictionary<string, DateTime>> GetLastSeenQuestionFamilyDatesAsync(IReadOnlyCollection<Guid> playerIds)
    {
        if (playerIds.Count == 0)
            return new Dictionary<string, DateTime>();

        var seenQuestions = await (
            from roomPlayer in _context.GameRoomPlayers.AsNoTracking()
            join roomQuestion in _context.GameRoomQuestions.AsNoTracking()
                on roomPlayer.RoomId equals roomQuestion.RoomId
            join room in _context.GameRooms.AsNoTracking()
                on roomPlayer.RoomId equals room.Id
            join question in _context.Questions.AsNoTracking()
                on roomQuestion.QuestionId equals question.Id
            where playerIds.Contains(roomPlayer.PlayerId)
            select new
            {
                question.TextAr,
                SeenAtUtc = room.CreatedAt
            })
            .ToListAsync();

        return seenQuestions
            .GroupBy(item => GetQuestionFamilyKey(item.TextAr ?? string.Empty))
            .ToDictionary(
                group => group.Key,
                group => group.Max(item => item.SeenAtUtc));
    }

    private static List<Question> SelectQuestionsForRoom(
        IReadOnlyList<Question> candidateQuestions,
        int requestedQuestionCount,
        ISet<string> recentlySeenQuestionFamilyKeys,
        IReadOnlyDictionary<string, DateTime> lastSeenQuestionFamilyDates)
    {
        var selected = new List<Question>();
        var selectedIds = new HashSet<Guid>();
        var selectedFamilyKeys = new HashSet<string>();
        var typeLimits = new QuestionTypeLimitState();

        AddCandidates(candidateQuestions.Where(q => !recentlySeenQuestionFamilyKeys.Contains(GetQuestionFamilyKey(q.TextAr ?? string.Empty))));

        if (selected.Count < requestedQuestionCount)
        {
            AddCandidates(candidateQuestions
                .Where(q => recentlySeenQuestionFamilyKeys.Contains(GetQuestionFamilyKey(q.TextAr ?? string.Empty)))
                .OrderBy(q => lastSeenQuestionFamilyDates.TryGetValue(GetQuestionFamilyKey(q.TextAr ?? string.Empty), out var lastSeenAtUtc)
                    ? lastSeenAtUtc
                    : DateTime.MinValue));
        }

        return selected;

        void AddCandidates(IEnumerable<Question> candidates)
        {
            foreach (var question in candidates)
            {
                if (selected.Count >= requestedQuestionCount)
                    break;

                if (!selectedIds.Add(question.Id))
                    continue;

                if (!selectedFamilyKeys.Add(GetQuestionFamilyKey(question.TextAr ?? string.Empty)))
                    continue;

                if (!typeLimits.TryAdd(question.TextAr ?? string.Empty))
                    continue;

                selected.Add(question);
            }
        }
    }

    private static string GetQuestionFamilyKey(string questionTextAr)
    {
        var normalized = NormalizeQuestionText(questionTextAr);

        foreach (var prefix in DerivedQuestionLeadPrefixes)
        {
            if (!normalized.StartsWith(prefix, StringComparison.Ordinal))
                continue;

            var remainder = normalized[prefix.Length..].TrimStart();
            while (remainder.Length > 0 && char.IsDigit(remainder[0]))
            {
                remainder = remainder[1..].TrimStart();
            }

            if (remainder.StartsWith(':'))
                return NormalizeQuestionText(remainder[1..]);
        }

        if (StartsWithSameFamilyComparisonPrefix(normalized))
        {
            var colonIndex = normalized.IndexOf(':', StringComparison.Ordinal);
            if (colonIndex >= 0 && colonIndex + 1 < normalized.Length)
                return NormalizeQuestionText(normalized[(colonIndex + 1)..]);
        }

        return normalized;
    }

    private static bool StartsWithSameFamilyComparisonPrefix(string normalizedQuestionTextAr)
    {
        return normalizedQuestionTextAr.StartsWith("الفخ القريب", StringComparison.Ordinal) ||
               normalizedQuestionTextAr.StartsWith("استبعد", StringComparison.Ordinal) ||
               normalizedQuestionTextAr.StartsWith("بين اختيارات متقاربة", StringComparison.Ordinal) ||
               normalizedQuestionTextAr.StartsWith("اختيار قريب لكنه فخ", StringComparison.Ordinal);
    }

    private static string NormalizeQuestionText(string questionTextAr)
    {
        return string.Join(' ', questionTextAr.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries)).Trim();
    }

    private sealed class QuestionTypeLimitState
    {
        private int _surahOrderCount;
        private int _surahAyatCount;
        private int _surahComparisonCount;

        public bool TryAdd(string questionTextAr)
        {
            if (questionTextAr.Contains("السورة رقم") && questionTextAr.Contains("في القرآن"))
            {
                if (_surahOrderCount >= MaxPerQuestionTypePerGame)
                    return false;

                _surahOrderCount++;
                return true;
            }

            if (questionTextAr.Contains("عدد آيات سورة"))
            {
                if (_surahAyatCount >= MaxPerQuestionTypePerGame)
                    return false;

                _surahAyatCount++;
                return true;
            }

            if (questionTextAr.Contains("أيهما أطول"))
            {
                if (_surahComparisonCount >= MaxPerQuestionTypePerGame)
                    return false;

                _surahComparisonCount++;
                return true;
            }

            return true;
        }
    }

    public async Task<QuestionDto?> GetNextQuestionAsync(string roomCode)
    {
        var lockObj = GetRoomLock(roomCode);
        await lockObj.WaitAsync();

        try
        {
            var nowUtc = DateTime.UtcNow;
            var snapshot = await _roomStore.GetRoomAsync(roomCode);
            if (snapshot == null)
                return null;

            if (snapshot.Status != RoomStatus.Running)
                return null;

            snapshot.CurrentQuestionIndex++;
            if (snapshot.CurrentQuestionIndex >= snapshot.QuestionIds.Count)
            {
                // Game finished
                snapshot.Status = RoomStatus.Finished;
                snapshot.CurrentQuestionId = null;
                snapshot.QuestionStartedAt = null;
                snapshot.LastActivityAtUtc = nowUtc;
                await _roomStore.SaveRoomAsync(snapshot);

                var room = await _context.GameRooms.FirstAsync(r => r.Code == roomCode);
                room.Status = RoomStatus.Finished;
                room.FinishedAtUtc = nowUtc;
                room.LastActivityAtUtc = nowUtc;
                room.CurrentQuestionIndex = snapshot.CurrentQuestionIndex;
                room.CurrentQuestionId = null;
                room.QuestionStartedAtUtc = null;
                await _context.SaveChangesAsync();

                return null;
            }

            var questionId = snapshot.QuestionIds[snapshot.CurrentQuestionIndex];
            snapshot.CurrentQuestionId = questionId;
            snapshot.PlayersAnsweredCurrentQuestion.Clear();
            snapshot.PlayerSelectedOptions.Clear();
            snapshot.QuestionStartedAt = nowUtc;
            snapshot.LastActivityAtUtc = nowUtc;

            await _roomStore.SaveRoomAsync(snapshot);

            var room = await _context.GameRooms.FirstAsync(r => r.Code == roomCode);
            room.Status = RoomStatus.Running;
            room.LastActivityAtUtc = nowUtc;
            room.CurrentQuestionIndex = snapshot.CurrentQuestionIndex;
            room.CurrentQuestionId = questionId;
            room.QuestionStartedAtUtc = nowUtc;
            await _context.SaveChangesAsync();

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
        finally
        {
            lockObj.Release();
        }
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
        var lockObj = GetRoomLock(roomCode);
        await lockObj.WaitAsync();

        try
        {
            var nowUtc = DateTime.UtcNow;
            var snapshot = await _roomStore.GetRoomAsync(roomCode);
            if (snapshot == null)
                throw new InvalidOperationException("Room not found");

            if (snapshot.CurrentQuestionId != questionId)
                throw new InvalidOperationException("Question not current");

            if (snapshot.PlayersAnsweredCurrentQuestion.Contains(playerId))
                throw new InvalidOperationException("Player already answered");

            // Mark player as answered and store selected option
            snapshot.PlayersAnsweredCurrentQuestion.Add(playerId);
            snapshot.PlayerSelectedOptions[playerId] = optionId;

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
                AnsweredAtUtc = nowUtc
            });

            // Update database score
            var roomPlayer = await _context.GameRoomPlayers
                .FirstAsync(rp => rp.RoomId == snapshot.RoomId && rp.PlayerId == playerId);
            roomPlayer.Score = player.Score;

            var room = await _context.GameRooms.FirstAsync(r => r.Id == snapshot.RoomId);
            room.LastActivityAtUtc = nowUtc;
            snapshot.LastActivityAtUtc = nowUtc;

            await _context.SaveChangesAsync();
            await _roomStore.SaveRoomAsync(snapshot);

            return (isCorrect, deltaScore, player.Score, isFirstCorrect, allPlayersAnsweredWrong);
        }
        finally
        {
            lockObj.Release();
        }
    }

    public async Task<bool> EndCurrentQuestionAsync(string roomCode, Guid questionId)
    {
        var lockObj = GetRoomLock(roomCode);
        await lockObj.WaitAsync();

        try
        {
            var nowUtc = DateTime.UtcNow;
            var snapshot = await _roomStore.GetRoomAsync(roomCode);
            if (snapshot == null ||
                snapshot.Status != RoomStatus.Running ||
                snapshot.CurrentQuestionId != questionId)
            {
                return false;
            }

            snapshot.CurrentQuestionId = null;
            snapshot.QuestionStartedAt = null;
            snapshot.LastActivityAtUtc = nowUtc;
            await _roomStore.SaveRoomAsync(snapshot);

            var room = await _context.GameRooms.FirstOrDefaultAsync(r => r.Code == roomCode);
            if (room != null)
            {
                room.CurrentQuestionId = null;
                room.QuestionStartedAtUtc = null;
                room.LastActivityAtUtc = nowUtc;
                await _context.SaveChangesAsync();
            }

            return true;
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

        var sortedPlayers = snapshot.Players.Values
            .OrderByDescending(p => p.Score)
            .ThenBy(p => p.DisplayName)
            .ToList();

        // Calculate tied ranks using dense ranking (no gaps)
        int currentRank = 1;
        for (int i = 0; i < sortedPlayers.Count; i++)
        {
            if (i > 0 && sortedPlayers[i].Score < sortedPlayers[i - 1].Score)
            {
                currentRank++;
            }
            sortedPlayers[i].Rank = currentRank;
        }

        return sortedPlayers;
    }

    public async Task<Guid> GetCorrectOptionIdAsync(Guid questionId)
    {
        var correctOption = await _context.Options
            .FirstAsync(o => o.QuestionId == questionId && o.IsCorrect);
        return correctOption.Id;
    }

    private static SemaphoreSlim GetRoomLock(string roomCode)
    {
        return RoomLocks.GetOrAdd(roomCode, _ => new SemaphoreSlim(1, 1));
    }
}
