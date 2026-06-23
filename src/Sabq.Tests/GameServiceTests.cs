using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Sabq.Application.Services;
using Sabq.Domain.Entities;
using Sabq.Domain.Enums;
using Sabq.Infrastructure.Data;
using Sabq.Infrastructure.RoomState;
using Sabq.Shared.DTOs;
using Xunit;

namespace Sabq.Tests;

public class GameServiceTests
{
    private static DbContextOptions<SabqDbContext> CreateInMemoryOptions()
    {
        return new DbContextOptionsBuilder<SabqDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    [Fact]
    public async Task StartGameAsync_AvoidsRecentlySeenQuestions_WhenFreshQuestionsAreAvailable()
    {
        var options = CreateInMemoryOptions();
        await using var context = new SabqDbContext(options);

        var category = AddCategory(context);
        var questions = AddQuestions(context, category.Id, 6);
        var hostPlayerId = Guid.NewGuid();
        AddPlayer(context, hostPlayerId);
        AddHistoricalRoom(context, hostPlayerId, DateTime.UtcNow.AddDays(-7), questions[0], questions[1]);

        const string roomCode = "FRESH1";
        var roomId = AddCurrentRoom(context, roomCode, hostPlayerId, category.Id, questionCount: 3);
        await context.SaveChangesAsync();

        var roomStore = await CreateRoomStoreAsync(roomCode, roomId, hostPlayerId);
        var service = new GameService(context, roomStore);

        var selectedQuestions = await service.StartGameAsync(roomCode, hostPlayerId);

        var selectedIds = selectedQuestions.Select(q => q.Id).ToHashSet();
        Assert.Equal(3, selectedQuestions.Count);
        Assert.DoesNotContain(questions[0].Id, selectedIds);
        Assert.DoesNotContain(questions[1].Id, selectedIds);
    }

    [Fact]
    public async Task StartGameAsync_AvoidsRecentlySeenQuestions_ForAllPlayersInRoom()
    {
        var options = CreateInMemoryOptions();
        await using var context = new SabqDbContext(options);

        var category = AddCategory(context);
        var questions = AddQuestions(context, category.Id, 5);
        var hostPlayerId = Guid.NewGuid();
        var secondPlayerId = Guid.NewGuid();
        AddPlayer(context, hostPlayerId);
        AddPlayer(context, secondPlayerId);
        AddHistoricalRoom(context, hostPlayerId, DateTime.UtcNow.AddDays(-5), questions[0]);
        AddHistoricalRoom(context, secondPlayerId, DateTime.UtcNow.AddDays(-6), questions[1]);

        const string roomCode = "UNION1";
        var roomId = AddCurrentRoom(context, roomCode, hostPlayerId, category.Id, questionCount: 2);
        await context.SaveChangesAsync();

        var roomStore = await CreateRoomStoreAsync(roomCode, roomId, hostPlayerId, secondPlayerId);
        var service = new GameService(context, roomStore);

        var selectedQuestions = await service.StartGameAsync(roomCode, hostPlayerId);

        var selectedIds = selectedQuestions.Select(q => q.Id).ToHashSet();
        Assert.Equal(2, selectedQuestions.Count);
        Assert.DoesNotContain(questions[0].Id, selectedIds);
        Assert.DoesNotContain(questions[1].Id, selectedIds);
    }

    [Fact]
    public async Task StartGameAsync_FillsFromOldestRecentlySeenQuestions_WhenFreshQuestionsAreInsufficient()
    {
        var options = CreateInMemoryOptions();
        await using var context = new SabqDbContext(options);

        var category = AddCategory(context);
        var questions = AddQuestions(context, category.Id, 3);
        var hostPlayerId = Guid.NewGuid();
        AddPlayer(context, hostPlayerId);
        AddHistoricalRoom(context, hostPlayerId, DateTime.UtcNow.AddDays(-10), questions[0]);
        AddHistoricalRoom(context, hostPlayerId, DateTime.UtcNow.AddDays(-80), questions[1]);

        const string roomCode = "FALLBK";
        var roomId = AddCurrentRoom(context, roomCode, hostPlayerId, category.Id, questionCount: 3);
        await context.SaveChangesAsync();

        var roomStore = await CreateRoomStoreAsync(roomCode, roomId, hostPlayerId);
        var service = new GameService(context, roomStore);

        var selectedQuestions = await service.StartGameAsync(roomCode, hostPlayerId);

        Assert.Equal(3, selectedQuestions.Count);
        Assert.Equal(questions[2].Id, selectedQuestions[0].Id);
        Assert.Equal(questions[1].Id, selectedQuestions[1].Id);
        Assert.Equal(questions[0].Id, selectedQuestions[2].Id);
        Assert.Equal(3, selectedQuestions.Select(q => q.Id).Distinct().Count());
    }

    [Fact]
    public async Task StartGameAsync_TreatsDerivedVariantsAsSameQuestionFamily()
    {
        var options = CreateInMemoryOptions();
        await using var context = new SabqDbContext(options);

        var category = AddCategory(context);
        var original = AddQuestion(context, category.Id, 1, "أصل الاختبار: أي اختيار يناسب الدليل؟");
        var derivedVariant = AddQuestion(context, category.Id, 2, "كارت تحدي قريب الاختيارات: أصل الاختبار: أي اختيار يناسب الدليل؟");
        var freshQuestion = AddQuestion(context, category.Id, 3, "بطاقة مختلفة تماما: أي اختيار يناسب الدليل؟");
        var hostPlayerId = Guid.NewGuid();
        AddPlayer(context, hostPlayerId);
        AddHistoricalRoom(context, hostPlayerId, DateTime.UtcNow.AddDays(-2), original);

        const string roomCode = "FAMLY1";
        var roomId = AddCurrentRoom(context, roomCode, hostPlayerId, category.Id, questionCount: 1);
        await context.SaveChangesAsync();

        var roomStore = await CreateRoomStoreAsync(roomCode, roomId, hostPlayerId);
        var service = new GameService(context, roomStore);

        var selectedQuestions = await service.StartGameAsync(roomCode, hostPlayerId);

        Assert.Single(selectedQuestions);
        Assert.Equal(freshQuestion.Id, selectedQuestions[0].Id);
        Assert.NotEqual(derivedVariant.Id, selectedQuestions[0].Id);
    }

    private static Category AddCategory(SabqDbContext context)
    {
        var category = new Category
        {
            Id = Guid.NewGuid(),
            NameAr = "اختبار",
            NameEn = "Test",
            Slug = $"test-{Guid.NewGuid():N}",
            IsActive = true
        };
        context.Categories.Add(category);
        return category;
    }

    private static List<Question> AddQuestions(SabqDbContext context, Guid categoryId, int count)
    {
        var questions = new List<Question>();
        for (var i = 1; i <= count; i++)
        {
            questions.Add(AddQuestion(context, categoryId, i, $"بطاقة اختبار رقم {i}: أي اختيار يناسب الدليل؟"));
        }

        return questions;
    }

    private static Question AddQuestion(SabqDbContext context, Guid categoryId, int number, string textAr)
    {
        var question = new Question
        {
            Id = Guid.NewGuid(),
            CategoryId = categoryId,
            Difficulty = Difficulty.Medium,
            TextAr = textAr,
            TextEn = $"Test card {number}: which option fits the clue?",
            Slug = $"test-question-{Guid.NewGuid():N}",
            TimeLimitSec = 20,
            IsActive = true
        };

        question.Options.Add(new Option
        {
            Id = Guid.NewGuid(),
            QuestionId = question.Id,
            TextAr = $"الإجابة الصحيحة {number}",
            TextEn = $"Correct answer {number}",
            IsCorrect = true,
            DisplayOrder = 1
        });
        question.Options.Add(new Option
        {
            Id = Guid.NewGuid(),
            QuestionId = question.Id,
            TextAr = $"اختيار قريب أ {number}",
            TextEn = $"Close option A {number}",
            IsCorrect = false,
            DisplayOrder = 2
        });
        question.Options.Add(new Option
        {
            Id = Guid.NewGuid(),
            QuestionId = question.Id,
            TextAr = $"اختيار قريب ب {number}",
            TextEn = $"Close option B {number}",
            IsCorrect = false,
            DisplayOrder = 3
        });
        question.Options.Add(new Option
        {
            Id = Guid.NewGuid(),
            QuestionId = question.Id,
            TextAr = $"اختيار قريب ج {number}",
            TextEn = $"Close option C {number}",
            IsCorrect = false,
            DisplayOrder = 4
        });

        context.Questions.Add(question);
        return question;
    }

    private static void AddPlayer(SabqDbContext context, Guid playerId)
    {
        context.Players.Add(new Player
        {
            Id = playerId,
            DisplayName = $"Player {playerId:N}"[..16],
            CreatedAt = DateTime.UtcNow
        });
    }

    private static void AddHistoricalRoom(
        SabqDbContext context,
        Guid playerId,
        DateTime createdAtUtc,
        params Question[] questions)
    {
        var room = new GameRoom
        {
            Id = Guid.NewGuid(),
            Code = $"H{Guid.NewGuid():N}"[..6].ToUpperInvariant(),
            HostPlayerId = playerId,
            Status = RoomStatus.Finished,
            CreatedAt = createdAtUtc
        };

        context.GameRooms.Add(room);
        context.GameRoomPlayers.Add(new GameRoomPlayer
        {
            RoomId = room.Id,
            PlayerId = playerId,
            Score = 0,
            JoinedAt = createdAtUtc
        });

        for (var i = 0; i < questions.Length; i++)
        {
            context.GameRoomQuestions.Add(new GameRoomQuestion
            {
                RoomId = room.Id,
                QuestionId = questions[i].Id,
                OrderIndex = i
            });
        }
    }

    private static Guid AddCurrentRoom(
        SabqDbContext context,
        string roomCode,
        Guid hostPlayerId,
        Guid categoryId,
        int questionCount)
    {
        var roomId = Guid.NewGuid();
        var settings = new CreateRoomRequest
        {
            CategoryIds = new List<Guid> { categoryId },
            Difficulties = new List<Difficulty> { Difficulty.Medium },
            QuestionCount = questionCount,
            TimeLimitSec = 20,
            HostParticipates = true
        };

        context.GameRooms.Add(new GameRoom
        {
            Id = roomId,
            Code = roomCode,
            HostPlayerId = hostPlayerId,
            Status = RoomStatus.Lobby,
            SettingsJson = JsonSerializer.Serialize(settings),
            CreatedAt = DateTime.UtcNow
        });

        return roomId;
    }

    private static async Task<InMemoryRoomStore> CreateRoomStoreAsync(
        string roomCode,
        Guid roomId,
        Guid hostPlayerId,
        params Guid[] extraPlayerIds)
    {
        var roomStore = new InMemoryRoomStore();
        var players = new Dictionary<Guid, PlayerDto>
        {
            [hostPlayerId] = new PlayerDto
            {
                Id = hostPlayerId,
                DisplayName = "Host",
                Score = 0
            }
        };

        foreach (var playerId in extraPlayerIds)
        {
            players[playerId] = new PlayerDto
            {
                Id = playerId,
                DisplayName = $"Player {players.Count + 1}",
                Score = 0
            };
        }

        await roomStore.SaveRoomAsync(new RoomStateSnapshot
        {
            RoomCode = roomCode,
            RoomId = roomId,
            HostPlayerId = hostPlayerId,
            HostParticipates = true,
            Status = RoomStatus.Lobby,
            Players = players
        });

        return roomStore;
    }
}
