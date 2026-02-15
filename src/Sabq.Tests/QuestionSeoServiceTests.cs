using Microsoft.EntityFrameworkCore;
using Sabq.Application.Services;
using Sabq.Domain.Entities;
using Sabq.Domain.Enums;
using Sabq.Infrastructure.Data;
using Sabq.Shared.DTOs;
using Xunit;

namespace Sabq.Tests;

/// <summary>
/// Tests for QuestionSeoService functionality.
/// </summary>
public class QuestionSeoServiceTests
{
    private static DbContextOptions<SabqDbContext> CreateInMemoryOptions()
    {
        return new DbContextOptionsBuilder<SabqDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    private static async Task SeedTestData(SabqDbContext context)
    {
        var categoryId = Guid.NewGuid();
        var category = new Category
        {
            Id = categoryId,
            NameAr = "إسلامي",
            NameEn = "Islamic",
            Slug = "islamic",
            IsActive = true,
            DisplayOrder = 1
        };
        context.Categories.Add(category);

        for (int i = 0; i < 25; i++)
        {
            var questionId = Guid.NewGuid();
            var question = new Question
            {
                Id = questionId,
                CategoryId = categoryId,
                TextAr = $"سؤال رقم {i + 1}",
                TextEn = $"Question number {i + 1}",
                Slug = $"question-{i + 1}",
                Difficulty = i % 3 == 0 ? Difficulty.Easy : (i % 3 == 1 ? Difficulty.Medium : Difficulty.Hard),
                IsActive = true,
                TimeLimitSec = 15,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-i)
            };
            context.Questions.Add(question);

            // Add options
            for (int j = 0; j < 4; j++)
            {
                context.Options.Add(new Option
                {
                    Id = Guid.NewGuid(),
                    QuestionId = questionId,
                    TextAr = $"خيار {j + 1}",
                    TextEn = $"Option {j + 1}",
                    IsCorrect = j == 0,
                    DisplayOrder = j
                });
            }
        }

        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Tests that GetQuestionsAsync returns paginated results.
    /// </summary>
    [Fact]
    public async Task GetQuestions_ReturnsPaginatedResults()
    {
        // Arrange
        var options = CreateInMemoryOptions();
        using var context = new SabqDbContext(options);
        await SeedTestData(context);

        var service = new QuestionSeoService(context);
        var request = new QuestionListRequest { PageNumber = 1, PageSize = 10 };

        // Act
        var result = await service.GetQuestionsAsync(request);

        // Assert
        Assert.Equal(25, result.TotalCount);
        Assert.Equal(10, result.Items.Count);
        Assert.Equal(1, result.PageNumber);
        Assert.Equal(3, result.TotalPages);
        Assert.True(result.HasNextPage);
        Assert.False(result.HasPreviousPage);
    }

    /// <summary>
    /// Tests that questions include options.
    /// </summary>
    [Fact]
    public async Task GetQuestions_IncludesOptions()
    {
        // Arrange
        var options = CreateInMemoryOptions();
        using var context = new SabqDbContext(options);
        await SeedTestData(context);

        var service = new QuestionSeoService(context);
        var request = new QuestionListRequest { PageNumber = 1, PageSize = 5 };

        // Act
        var result = await service.GetQuestionsAsync(request);

        // Assert
        Assert.All(result.Items, q =>
        {
            Assert.Equal(4, q.Options.Count);
            Assert.Single(q.Options, o => o.IsCorrect);
        });
    }

    /// <summary>
    /// Tests filtering by category slug.
    /// </summary>
    [Fact]
    public async Task GetQuestions_FiltersByCategory()
    {
        // Arrange
        var options = CreateInMemoryOptions();
        using var context = new SabqDbContext(options);
        await SeedTestData(context);

        // Add another category with questions
        var otherCategoryId = Guid.NewGuid();
        context.Categories.Add(new Category
        {
            Id = otherCategoryId,
            NameAr = "علوم",
            NameEn = "Science",
            Slug = "science",
            IsActive = true
        });
        context.Questions.Add(new Question
        {
            Id = Guid.NewGuid(),
            CategoryId = otherCategoryId,
            TextAr = "سؤال علمي",
            Slug = "science-question",
            IsActive = true
        });
        await context.SaveChangesAsync();

        var service = new QuestionSeoService(context);
        var request = new QuestionListRequest { CategorySlug = "islamic", PageSize = 50 };

        // Act
        var result = await service.GetQuestionsAsync(request);

        // Assert
        Assert.Equal(25, result.TotalCount);
        Assert.All(result.Items, q => Assert.Equal("islamic", q.CategorySlug));
    }

    /// <summary>
    /// Tests filtering by difficulty.
    /// </summary>
    [Fact]
    public async Task GetQuestions_FiltersByDifficulty()
    {
        // Arrange
        var options = CreateInMemoryOptions();
        using var context = new SabqDbContext(options);
        await SeedTestData(context);

        var service = new QuestionSeoService(context);
        var request = new QuestionListRequest { Difficulty = "Easy", PageSize = 50 };

        // Act
        var result = await service.GetQuestionsAsync(request);

        // Assert
        Assert.True(result.TotalCount > 0);
        Assert.All(result.Items, q => Assert.Equal("Easy", q.Difficulty));
    }

    /// <summary>
    /// Tests search functionality.
    /// </summary>
    [Fact]
    public async Task GetQuestions_SearchTermFilters()
    {
        // Arrange
        var options = CreateInMemoryOptions();
        using var context = new SabqDbContext(options);
        await SeedTestData(context);

        var service = new QuestionSeoService(context);
        var request = new QuestionListRequest { SearchTerm = "رقم 1", PageSize = 50 };

        // Act
        var result = await service.GetQuestionsAsync(request);

        // Assert
        Assert.True(result.TotalCount > 0);
        Assert.All(result.Items, q => Assert.Contains("1", q.TextAr));
    }

    /// <summary>
    /// Tests getting a question by slug.
    /// </summary>
    [Fact]
    public async Task GetQuestionBySlug_ReturnsCorrectQuestion()
    {
        // Arrange
        var options = CreateInMemoryOptions();
        using var context = new SabqDbContext(options);
        
        var categoryId = Guid.NewGuid();
        context.Categories.Add(new Category
        {
            Id = categoryId,
            NameAr = "تاريخ",
            Slug = "history",
            IsActive = true
        });

        var questionId = Guid.NewGuid();
        context.Questions.Add(new Question
        {
            Id = questionId,
            CategoryId = categoryId,
            TextAr = "من بنى الكعبة؟",
            TextEn = "Who built the Kaaba?",
            Slug = "who-built-the-kaaba",
            IsActive = true
        });

        context.Options.Add(new Option
        {
            Id = Guid.NewGuid(),
            QuestionId = questionId,
            TextAr = "إبراهيم عليه السلام",
            IsCorrect = true
        });

        await context.SaveChangesAsync();

        var service = new QuestionSeoService(context);

        // Act
        var result = await service.GetQuestionBySlugAsync("history", "who-built-the-kaaba");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("من بنى الكعبة؟", result.TextAr);
        Assert.Equal("history", result.CategorySlug);
        Assert.Single(result.Options);
    }

    /// <summary>
    /// Tests that non-existent question returns null.
    /// </summary>
    [Fact]
    public async Task GetQuestionBySlug_NonExistent_ReturnsNull()
    {
        // Arrange
        var options = CreateInMemoryOptions();
        using var context = new SabqDbContext(options);
        var service = new QuestionSeoService(context);

        // Act
        var result = await service.GetQuestionBySlugAsync("fake", "not-found");

        // Assert
        Assert.Null(result);
    }

    /// <summary>
    /// Tests slug generation.
    /// </summary>
    [Theory]
    [InlineData("Hello World", "hello-world")]
    [InlineData("مرحبا بالعالم", "مرحبا-بالعالم")]
    [InlineData("Test  Multiple   Spaces", "test-multiple-spaces")]
    [InlineData("Hello! @World#", "hello-world")]
    public void GenerateSlug_ProducesCorrectSlug(string input, string expected)
    {
        // Act
        var result = QuestionSeoService.GenerateSlug(input);

        // Assert
        Assert.Equal(expected, result);
    }

    /// <summary>
    /// Tests that empty input generates a random slug.
    /// </summary>
    [Fact]
    public void GenerateSlug_EmptyInput_GeneratesRandomSlug()
    {
        // Act
        var result = QuestionSeoService.GenerateSlug("");

        // Assert
        Assert.NotEmpty(result);
        Assert.Equal(8, result.Length);
    }
}
