using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Sabq.Domain.Entities;
using Sabq.Domain.Enums;

namespace Sabq.Infrastructure.Data;

public static class DbSeeder
{
    private const string QuestionBankRelativePath = "Data/QuestionBank/questions.ar.json";

    public static async Task SeedAsync(SabqDbContext context)
    {
        var bank = LoadQuestionBank();
        ValidateQuestionBank(bank);

        var now = DateTime.UtcNow;
        var desiredCategorySlugs = bank.Categories.Select(c => c.Slug).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var desiredQuestionSlugs = bank.Questions.Select(q => q.Slug).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var categoriesBySlug = await context.Categories
            .ToDictionaryAsync(c => c.Slug, StringComparer.OrdinalIgnoreCase);

        foreach (var categoryData in bank.Categories.OrderBy(c => c.DisplayOrder))
        {
            if (!categoriesBySlug.TryGetValue(categoryData.Slug, out var category))
            {
                category = new Category { Id = Guid.NewGuid(), Slug = categoryData.Slug };
                context.Categories.Add(category);
                categoriesBySlug[categoryData.Slug] = category;
            }

            category.NameAr = categoryData.NameAr;
            category.NameEn = categoryData.NameEn;
            category.Description = categoryData.Description;
            category.DisplayOrder = categoryData.DisplayOrder;
            category.IsActive = true;
        }

        foreach (var category in categoriesBySlug.Values)
        {
            if (category.IsActive && !desiredCategorySlugs.Contains(category.Slug))
            {
                category.IsActive = false;
            }
        }

        await context.SaveChangesAsync();

        // Existing game history can reference old questions and options, so old data is disabled rather than deleted.
        var activeQuestions = await context.Questions
            .Where(q => q.IsActive)
            .ToListAsync();

        foreach (var question in activeQuestions)
        {
            if (!desiredQuestionSlugs.Contains(question.Slug))
            {
                question.IsActive = false;
                question.UpdatedAtUtc = now;
            }
        }

        var existingQuestionsBySlug = await LoadExistingQuestionSetAsync(context, desiredQuestionSlugs);

        foreach (var questionData in bank.Questions)
        {
            var category = categoriesBySlug[questionData.CategorySlug];

            if (!existingQuestionsBySlug.TryGetValue(questionData.Slug, out var question))
            {
                question = new Question
                {
                    Id = Guid.NewGuid(),
                    Slug = questionData.Slug,
                    CreatedAtUtc = now
                };
                context.Questions.Add(question);
                existingQuestionsBySlug[questionData.Slug] = question;
            }

            question.CategoryId = category.Id;
            question.TextAr = questionData.TextAr;
            question.TextEn = questionData.TextEn;
            question.Difficulty = ParseDifficulty(questionData.Difficulty);
            question.TimeLimitSec = questionData.TimeLimitSec;
            question.IsActive = true;
            question.UpdatedAtUtc = now;

            await UpsertOptionsAsync(context, question, questionData.Options);
        }

        await context.SaveChangesAsync();
    }

    private static async Task<Dictionary<string, Question>> LoadExistingQuestionSetAsync(
        SabqDbContext context,
        HashSet<string> desiredQuestionSlugs)
    {
        var result = new Dictionary<string, Question>(StringComparer.OrdinalIgnoreCase);

        foreach (var slugChunk in desiredQuestionSlugs.Chunk(500))
        {
            var chunk = slugChunk.ToArray();
            var questions = await context.Questions
                .Include(q => q.Options)
                .Where(q => chunk.Contains(q.Slug))
                .ToListAsync();

            foreach (var question in questions)
            {
                result[question.Slug] = question;
            }
        }

        return result;
    }

    private static async Task UpsertOptionsAsync(
        SabqDbContext context,
        Question question,
        IReadOnlyList<QuestionBankOption> optionData)
    {
        var existingOptions = question.Options
            .OrderBy(o => o.DisplayOrder)
            .ThenBy(o => o.Id)
            .ToList();

        for (var i = 0; i < optionData.Count; i++)
        {
            var data = optionData[i];
            Option option;

            if (i < existingOptions.Count)
            {
                option = existingOptions[i];
            }
            else
            {
                option = new Option
                {
                    Id = Guid.NewGuid(),
                    QuestionId = question.Id
                };
                question.Options.Add(option);
            }

            option.QuestionId = question.Id;
            option.TextAr = data.TextAr;
            option.TextEn = data.TextEn;
            option.IsCorrect = data.IsCorrect;
            option.DisplayOrder = data.DisplayOrder;
        }

        foreach (var extraOption in existingOptions.Skip(optionData.Count))
        {
            var isReferencedByHistory = await context.GameAnswers.AnyAsync(a => a.OptionId == extraOption.Id);
            if (!isReferencedByHistory)
            {
                context.Options.Remove(extraOption);
            }
        }
    }

    private static QuestionBank LoadQuestionBank()
    {
        var candidates = GetQuestionBankPathCandidates();
        var path = candidates.FirstOrDefault(File.Exists);

        if (path == null)
        {
            throw new FileNotFoundException(
                $"Question bank file was not found. Checked: {string.Join(", ", candidates)}");
        }

        var json = File.ReadAllText(path);
        var bank = JsonSerializer.Deserialize<QuestionBank>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return bank ?? throw new InvalidOperationException("Question bank file is empty or invalid.");
    }

    private static IEnumerable<string> GetQuestionBankPathCandidates()
    {
        yield return Path.Combine(AppContext.BaseDirectory, QuestionBankRelativePath);
        yield return Path.Combine(AppContext.BaseDirectory, "QuestionBank/questions.ar.json");
        yield return Path.Combine(Directory.GetCurrentDirectory(), QuestionBankRelativePath);
        yield return Path.GetFullPath(Path.Combine(
            Directory.GetCurrentDirectory(),
            "..",
            "Sabq.Infrastructure",
            QuestionBankRelativePath));
        yield return Path.GetFullPath(Path.Combine(
            Directory.GetCurrentDirectory(),
            "src",
            "Sabq.Infrastructure",
            QuestionBankRelativePath));
    }

    private static void ValidateQuestionBank(QuestionBank bank)
    {
        if (bank.Categories.Count == 0)
        {
            throw new InvalidOperationException("Question bank must contain at least one category.");
        }

        if (bank.Questions.Count == 0)
        {
            throw new InvalidOperationException("Question bank must contain at least one question.");
        }

        var categorySlugs = bank.Categories
            .Select(c => c.Slug)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var duplicateQuestionSlug = bank.Questions
            .GroupBy(q => q.Slug, StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault(g => g.Count() > 1)
            ?.Key;

        if (!string.IsNullOrWhiteSpace(duplicateQuestionSlug))
        {
            throw new InvalidOperationException($"Duplicate question slug in bank: {duplicateQuestionSlug}");
        }

        foreach (var category in bank.Categories)
        {
            if (string.IsNullOrWhiteSpace(category.Slug) ||
                string.IsNullOrWhiteSpace(category.NameAr) ||
                string.IsNullOrWhiteSpace(category.NameEn))
            {
                throw new InvalidOperationException("Every category must have slug, Arabic name, and English name.");
            }
        }

        foreach (var question in bank.Questions)
        {
            if (!categorySlugs.Contains(question.CategorySlug))
            {
                throw new InvalidOperationException($"Question {question.Slug} uses unknown category {question.CategorySlug}.");
            }

            if (string.IsNullOrWhiteSpace(question.TextAr) ||
                string.IsNullOrWhiteSpace(question.TextEn) ||
                string.IsNullOrWhiteSpace(question.Slug))
            {
                throw new InvalidOperationException($"Question {question.Slug} is missing required text or slug.");
            }

            if (question.TextAr.Contains("اختر الإجابة الصحيحة المرتبطة", StringComparison.Ordinal))
            {
                throw new InvalidOperationException($"Question {question.Slug} contains a banned filler prompt.");
            }

            if (question.Options.Count != 4)
            {
                throw new InvalidOperationException($"Question {question.Slug} must have exactly 4 options.");
            }

            if (question.Options.Count(o => o.IsCorrect) != 1)
            {
                throw new InvalidOperationException($"Question {question.Slug} must have exactly one correct option.");
            }

            _ = ParseDifficulty(question.Difficulty);
        }
    }

    private static Difficulty ParseDifficulty(string difficulty)
    {
        return Enum.TryParse<Difficulty>(difficulty, ignoreCase: true, out var parsed)
            ? parsed
            : throw new InvalidOperationException($"Invalid question difficulty: {difficulty}");
    }

    private sealed class QuestionBank
    {
        public List<QuestionBankCategory> Categories { get; set; } = new();
        public List<QuestionBankQuestion> Questions { get; set; } = new();
    }

    private sealed class QuestionBankCategory
    {
        public string Slug { get; set; } = string.Empty;
        public string NameAr { get; set; } = string.Empty;
        public string NameEn { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DisplayOrder { get; set; }
    }

    private sealed class QuestionBankQuestion
    {
        public string Slug { get; set; } = string.Empty;
        public string CategorySlug { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public int TimeLimitSec { get; set; }
        public string TextAr { get; set; } = string.Empty;
        public string TextEn { get; set; } = string.Empty;
        public List<QuestionBankOption> Options { get; set; } = new();
    }

    private sealed class QuestionBankOption
    {
        public string TextAr { get; set; } = string.Empty;
        public string TextEn { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public int DisplayOrder { get; set; }
    }
}
