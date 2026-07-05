using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Sabq.Api.Services;
using Sabq.Application.Services;
using Sabq.Domain.Entities;
using Sabq.Domain.Enums;
using Sabq.Infrastructure.Data;
using Sabq.Shared.DTOs;
using Xunit;

namespace Sabq.Tests;

public class AdminFeatureTests
{
    [Fact]
    public void AdminLogin_InvalidCredentials_ReturnsNull()
    {
        var service = CreateAdminAuthService();

        var response = service.Login(new AdminLoginRequest("admin", "wrong-password"));

        Assert.Null(response);
    }

    [Fact]
    public void AdminLogin_MissingConfiguredCredentials_ReturnsNull()
    {
        var configuration = new ConfigurationBuilder().Build();
        var tokenService = new JwtTokenService(
            "SabqSecretKey_ThisIsAVeryLongSecretKeyForJwtTokenGeneration_MinimumLength256Bits_Test",
            "SabqApi",
            "SabqClients");
        var service = new AdminAuthService(
            configuration,
            tokenService,
            NullLogger<AdminAuthService>.Instance);

        var response = service.Login(new AdminLoginRequest("admin", "correct-password"));

        Assert.Null(response);
    }

    [Fact]
    public void AdminLogin_ValidCredentials_ReturnsTokenWithAdminRole()
    {
        var service = CreateAdminAuthService();

        var response = service.Login(new AdminLoginRequest("admin", "correct-password"));

        Assert.NotNull(response);
        Assert.Equal("admin", response.Username);
        Assert.True(response.ExpiresAtUtc > DateTime.UtcNow);

        var token = new JwtSecurityTokenHandler().ReadJwtToken(response.Token);
        Assert.Contains(token.Claims, claim =>
            (claim.Type == "role" || claim.Type == ClaimTypes.Role) &&
            claim.Value == "admin");
    }

    [Fact]
    public void GuestToken_DoesNotContainAdminRole()
    {
        var tokenService = new JwtTokenService(
            "SabqSecretKey_ThisIsAVeryLongSecretKeyForJwtTokenGeneration_MinimumLength256Bits_Test",
            "SabqApi",
            "SabqClients");
        var player = new Player
        {
            Id = Guid.NewGuid(),
            DisplayName = "Guest",
            CreatedAt = DateTime.UtcNow
        };

        var token = new JwtSecurityTokenHandler().ReadJwtToken(tokenService.GenerateToken(player));

        Assert.DoesNotContain(token.Claims, claim =>
            (claim.Type == "role" || claim.Type == ClaimTypes.Role) &&
            claim.Value == "admin");
    }

    [Fact]
    public async Task AdminStatsSummary_UsesCurrentDatabaseCounts()
    {
        var options = new DbContextOptionsBuilder<SabqDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        await using var context = new SabqDbContext(options);
        var now = DateTime.UtcNow;
        var categoryId = Guid.NewGuid();
        var questionId = Guid.NewGuid();
        var inactiveQuestionId = Guid.NewGuid();
        var playerId = Guid.NewGuid();
        var oldPlayerId = Guid.NewGuid();
        var lobbyRoomId = Guid.NewGuid();
        var runningRoomId = Guid.NewGuid();
        var finishedRoomId = Guid.NewGuid();

        context.Categories.Add(new Category
        {
            Id = categoryId,
            NameAr = "رياضة",
            NameEn = "Sports",
            Slug = "sports",
            IsActive = true
        });

        context.Questions.AddRange(
            new Question
            {
                Id = questionId,
                CategoryId = categoryId,
                TextAr = "سؤال نشط",
                TextEn = "Active question",
                Slug = "active-question",
                IsActive = true
            },
            new Question
            {
                Id = inactiveQuestionId,
                CategoryId = categoryId,
                TextAr = "سؤال غير نشط",
                TextEn = "Inactive question",
                Slug = "inactive-question",
                IsActive = false
            });

        context.Players.AddRange(
            new Player { Id = playerId, DisplayName = "Recent", CreatedAt = now.AddDays(-1) },
            new Player { Id = oldPlayerId, DisplayName = "Old", CreatedAt = now.AddDays(-40) });

        context.GameRooms.AddRange(
            new GameRoom
            {
                Id = lobbyRoomId,
                Code = "LOBBY",
                HostPlayerId = playerId,
                Status = RoomStatus.Lobby,
                CreatedAt = now.AddDays(-1)
            },
            new GameRoom
            {
                Id = runningRoomId,
                Code = "RUNNG",
                HostPlayerId = playerId,
                Status = RoomStatus.Running,
                CreatedAt = now.AddDays(-10)
            },
            new GameRoom
            {
                Id = finishedRoomId,
                Code = "FINSH",
                HostPlayerId = oldPlayerId,
                Status = RoomStatus.Finished,
                CreatedAt = now.AddDays(-40)
            });

        context.GameAnswers.AddRange(
            new GameAnswer
            {
                Id = Guid.NewGuid(),
                RoomId = lobbyRoomId,
                PlayerId = playerId,
                QuestionId = questionId,
                OptionId = Guid.NewGuid(),
                IsCorrect = true,
                AnsweredAtUtc = now.AddDays(-1)
            },
            new GameAnswer
            {
                Id = Guid.NewGuid(),
                RoomId = runningRoomId,
                PlayerId = playerId,
                QuestionId = questionId,
                OptionId = Guid.NewGuid(),
                IsCorrect = false,
                AnsweredAtUtc = now.AddDays(-10)
            },
            new GameAnswer
            {
                Id = Guid.NewGuid(),
                RoomId = finishedRoomId,
                PlayerId = oldPlayerId,
                QuestionId = questionId,
                OptionId = Guid.NewGuid(),
                IsCorrect = true,
                AnsweredAtUtc = now.AddDays(-40)
            });

        context.ContactMessages.AddRange(
            new ContactMessage
            {
                Id = Guid.NewGuid(),
                Name = "Unread",
                Email = "unread@example.com",
                Message = "Need help",
                IsRead = false
            },
            new ContactMessage
            {
                Id = Guid.NewGuid(),
                Name = "Read",
                Email = "read@example.com",
                Message = "Thanks",
                IsRead = true
            });

        await context.SaveChangesAsync();

        var service = new AdminStatsService(context);

        var summary = await service.GetSummaryAsync();

        Assert.Equal(2, summary.TotalPlayers);
        Assert.Equal(3, summary.TotalRooms);
        Assert.Equal(2, summary.ActiveRooms);
        Assert.Equal(1, summary.FinishedRooms);
        Assert.Equal(3, summary.TotalAnswers);
        Assert.Equal(2, summary.CorrectAnswers);
        Assert.Equal(66.67, summary.CorrectAnswerRate);
        Assert.Equal(2, summary.TotalQuestions);
        Assert.Equal(1, summary.ActiveQuestions);
        Assert.Equal(1, summary.TotalCategories);
        Assert.Equal(2, summary.ContactMessages);
        Assert.Equal(1, summary.UnreadContactMessages);
        Assert.Equal(1, summary.Last7Days.NewPlayers);
        Assert.Equal(1, summary.Last7Days.NewRooms);
        Assert.Equal(1, summary.Last7Days.NewAnswers);
        Assert.Equal(1, summary.Last30Days.NewPlayers);
        Assert.Equal(2, summary.Last30Days.NewRooms);
        Assert.Equal(2, summary.Last30Days.NewAnswers);
        Assert.Single(summary.TopCategories);
        Assert.Equal("sports", summary.TopCategories[0].CategorySlug);
        Assert.Equal(3, summary.TopCategories[0].AnswerCount);
    }

    private static AdminAuthService CreateAdminAuthService()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "SabqSecretKey_ThisIsAVeryLongSecretKeyForJwtTokenGeneration_MinimumLength256Bits_Test",
                ["Jwt:Issuer"] = "SabqApi",
                ["Jwt:Audience"] = "SabqClients",
                ["Admin:Username"] = "admin",
                ["Admin:Password"] = "correct-password",
                ["Admin:TokenLifetimeMinutes"] = "60"
            })
            .Build();

        var tokenService = new JwtTokenService(
            configuration["Jwt:Secret"]!,
            configuration["Jwt:Issuer"]!,
            configuration["Jwt:Audience"]!);

        return new AdminAuthService(
            configuration,
            tokenService,
            NullLogger<AdminAuthService>.Instance);
    }
}
