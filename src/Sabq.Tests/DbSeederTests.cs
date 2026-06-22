using Microsoft.EntityFrameworkCore;
using Sabq.Infrastructure.Data;
using Xunit;

namespace Sabq.Tests;

public class DbSeederTests
{
    private static DbContextOptions<SabqDbContext> CreateInMemoryOptions()
    {
        return new DbContextOptionsBuilder<SabqDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    [Fact]
    public async Task SeedAsync_LoadsLocalQuestionBankWithValidQuestions()
    {
        var options = CreateInMemoryOptions();
        await using var context = new SabqDbContext(options);

        await DbSeeder.SeedAsync(context);

        var activeQuestionCount = await context.Questions.CountAsync(q => q.IsActive);
        var activeCategorySlugs = await context.Categories
            .Where(c => c.IsActive)
            .Select(c => c.Slug)
            .ToListAsync();

        var invalidQuestionCount = await context.Questions
            .Include(q => q.Options)
            .Where(q => q.IsActive)
            .CountAsync(q => q.Options.Count != 4 || q.Options.Count(o => o.IsCorrect) != 1);

        var bannedFillerQuestionCount = await context.Questions
            .Where(q => q.IsActive)
            .CountAsync(q => q.TextAr.Contains("اختر الإجابة الصحيحة المرتبطة"));

        Assert.InRange(activeQuestionCount, 700, 1500);
        Assert.Equal(15, activeCategorySlugs.Count);
        Assert.Contains("general-knowledge", activeCategorySlugs);
        Assert.Contains("religion-islamic", activeCategorySlugs);
        Assert.Contains("art", activeCategorySlugs);
        Assert.Contains("technology", activeCategorySlugs);
        Assert.Equal(0, invalidQuestionCount);
        Assert.Equal(0, bannedFillerQuestionCount);
    }

    [Fact]
    public async Task SeedAsync_DisablesQuestionsOutsideLocalBank()
    {
        var options = CreateInMemoryOptions();
        await using var context = new SabqDbContext(options);

        var oldCategory = new Sabq.Domain.Entities.Category
        {
            Id = Guid.NewGuid(),
            NameAr = "قديم",
            NameEn = "Old",
            Slug = "old",
            IsActive = true
        };
        var oldQuestion = new Sabq.Domain.Entities.Question
        {
            Id = Guid.NewGuid(),
            CategoryId = oldCategory.Id,
            TextAr = "سؤال قديم",
            TextEn = "Old question",
            Slug = "old-question",
            IsActive = true
        };

        context.Categories.Add(oldCategory);
        context.Questions.Add(oldQuestion);
        await context.SaveChangesAsync();

        await DbSeeder.SeedAsync(context);

        Assert.False(oldCategory.IsActive);
        Assert.False(oldQuestion.IsActive);
    }
}
