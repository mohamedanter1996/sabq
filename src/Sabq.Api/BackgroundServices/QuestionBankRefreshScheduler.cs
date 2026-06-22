using System.Data;
using System.Globalization;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Sabq.Domain.Entities;
using Sabq.Domain.Enums;
using Sabq.Infrastructure.Data;

namespace Sabq.Api.BackgroundServices;

/// <summary>
/// Refreshes the question bank from open, configurable sources on a monthly cadence.
/// Google is used only through Custom Search for source discovery; questions are imported
/// from structured/open providers after validation.
/// </summary>
public sealed class QuestionBankRefreshScheduler : BackgroundService
{
    private const string LockResource = "QuestionBankRefreshLock";
    private const int LockTimeoutMs = 0;

    private static readonly IReadOnlyDictionary<string, CategorySeed> CategorySeeds =
        new Dictionary<string, CategorySeed>(StringComparer.OrdinalIgnoreCase)
        {
            ["general-knowledge"] = new("معلومات عامة", "General Knowledge", 1),
            ["religion-islamic"] = new("دين وإسلاميات", "Religion and Islamic Studies", 2),
            ["history"] = new("تاريخ", "History", 3),
            ["geography"] = new("جغرافيا", "Geography", 4),
            ["art"] = new("فن", "Art", 5),
            ["film-tv"] = new("أفلام وتلفزيون", "Film & Television", 6),
            ["music"] = new("موسيقى", "Music", 7),
            ["books-literature"] = new("كتب وأدب", "Books & Literature", 8),
            ["sports"] = new("رياضة", "Sports", 9),
            ["science-nature"] = new("علوم وطبيعة", "Science & Nature", 10),
            ["technology"] = new("تكنولوجيا", "Technology", 11),
            ["politics"] = new("سياسة", "Politics", 12),
            ["animals"] = new("حيوانات", "Animals", 13),
            ["vehicles"] = new("مركبات", "Vehicles", 14),
            ["games"] = new("ألعاب", "Games", 15)
        };

    private readonly IServiceProvider _serviceProvider;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IOptionsMonitor<QuestionBankRefreshOptions> _options;
    private readonly ILogger<QuestionBankRefreshScheduler> _logger;

    public QuestionBankRefreshScheduler(
        IServiceProvider serviceProvider,
        IHttpClientFactory httpClientFactory,
        IOptionsMonitor<QuestionBankRefreshOptions> options,
        ILogger<QuestionBankRefreshScheduler> logger)
    {
        _serviceProvider = serviceProvider;
        _httpClientFactory = httpClientFactory;
        _options = options;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var options = GetOptions();
        if (!options.Enabled)
        {
            _logger.LogInformation("Question bank refresh scheduler is disabled");
            return;
        }

        _logger.LogInformation("Question bank refresh scheduler started");

        if (options.RunOnStartup)
        {
            await RunRefreshWithLockAsync(stoppingToken);
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var delay = TimeSpan.FromDays(Math.Max(1, GetOptions().IntervalDays));
                _logger.LogInformation(
                    "Next question bank refresh scheduled at {NextRunUtc} UTC",
                    DateTime.UtcNow.Add(delay));

                await Task.Delay(delay, stoppingToken);

                if (!stoppingToken.IsCancellationRequested)
                {
                    await RunRefreshWithLockAsync(stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Question bank refresh scheduler loop failed");
                await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
            }
        }

        _logger.LogInformation("Question bank refresh scheduler stopped");
    }

    private QuestionBankRefreshOptions GetOptions()
    {
        var options = _options.CurrentValue;
        options.IntervalDays = Math.Max(1, options.IntervalDays);
        options.MaxQuestionsPerRun = Math.Clamp(options.MaxQuestionsPerRun, 1, 500);
        return options;
    }

    private async Task RunRefreshWithLockAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SabqDbContext>();

        var connection = context.Database.GetDbConnection();
        await connection.OpenAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await context.Database.UseTransactionAsync(transaction, cancellationToken);

        try
        {
            if (!await TryAcquireLockAsync(connection, transaction, cancellationToken))
            {
                _logger.LogInformation("Question bank refresh skipped because another instance is running");
                return;
            }

            var options = GetOptions();
            var state = await QuestionImportState.CreateAsync(context, cancellationToken);
            var imported = 0;

            if (options.Wikidata.Enabled)
            {
                imported += await ImportWikidataQuestionsAsync(
                    context,
                    state,
                    options.MaxQuestionsPerRun - imported,
                    cancellationToken);
            }

            if (imported < options.MaxQuestionsPerRun && options.OpenTriviaDb.Enabled)
            {
                imported += await ImportOpenTriviaDbQuestionsAsync(
                    context,
                    state,
                    options,
                    options.MaxQuestionsPerRun - imported,
                    cancellationToken);
            }

            if (options.GoogleCustomSearch.Enabled)
            {
                await DiscoverGoogleSourcesAsync(options.GoogleCustomSearch, cancellationToken);
            }

            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation("Question bank refresh completed. Imported {ImportedCount} new questions", imported);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Question bank refresh failed");
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private async Task<bool> TryAcquireLockAsync(
        System.Data.Common.DbConnection connection,
        System.Data.Common.DbTransaction transaction,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = @"
            DECLARE @result INT;
            EXEC @result = sp_getapplock
                @Resource = @LockResource,
                @LockMode = 'Exclusive',
                @LockOwner = 'Transaction',
                @LockTimeout = @LockTimeout;
            SELECT @result;";

        command.Parameters.Add(new SqlParameter("@LockResource", SqlDbType.NVarChar, 255) { Value = LockResource });
        command.Parameters.Add(new SqlParameter("@LockTimeout", SqlDbType.Int) { Value = LockTimeoutMs });

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt32(result, CultureInfo.InvariantCulture) >= 0;
    }

    private async Task<int> ImportWikidataQuestionsAsync(
        SabqDbContext context,
        QuestionImportState state,
        int remaining,
        CancellationToken cancellationToken)
    {
        if (remaining <= 0)
        {
            return 0;
        }

        var client = _httpClientFactory.CreateClient(nameof(QuestionBankRefreshScheduler));
        var imported = 0;

        foreach (var query in BuildWikidataQueries())
        {
            if (imported >= remaining)
            {
                break;
            }

            List<WikidataRow> rows;
            try
            {
                rows = await QueryWikidataAsync(client, query, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Wikidata query {QueryName} failed", query.Name);
                continue;
            }

            var answerPool = rows
                .Select(r => r.Answer)
                .Where(a => !string.IsNullOrWhiteSpace(a))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            foreach (var row in rows.OrderBy(_ => Random.Shared.Next()))
            {
                if (imported >= remaining)
                {
                    break;
                }

                if (!BuildWikidataQuestion(query, row, answerPool, out var question))
                {
                    continue;
                }

                if (AddQuestion(context, state, question))
                {
                    imported++;
                }
            }
        }

        return imported;
    }

    private static IReadOnlyList<WikidataQuestionQuery> BuildWikidataQueries()
    {
        return
        [
            new WikidataQuestionQuery(
                "country-capitals",
                "geography",
                Difficulty.Easy,
                "ما عاصمة {0}؟",
                """
                SELECT DISTINCT ?subject ?subjectLabel ?answer ?answerLabel WHERE {
                  ?subject wdt:P31 wd:Q6256;
                           wdt:P36 ?answer.
                  SERVICE wikibase:label { bd:serviceParam wikibase:language "ar,en". }
                }
                LIMIT 250
                """,
                true,
                true,
                true),
            new WikidataQuestionQuery(
                "country-continents",
                "geography",
                Difficulty.Easy,
                "في أي قارة تقع {0}؟",
                """
                SELECT DISTINCT ?subject ?subjectLabel ?answer ?answerLabel WHERE {
                  ?subject wdt:P31 wd:Q6256;
                           wdt:P30 ?answer.
                  SERVICE wikibase:label { bd:serviceParam wikibase:language "ar,en". }
                }
                LIMIT 250
                """,
                true,
                true,
                true),
            new WikidataQuestionQuery(
                "chemical-symbols",
                "science-nature",
                Difficulty.Medium,
                "ما الرمز الكيميائي لعنصر {0}؟",
                """
                SELECT DISTINCT ?subject ?subjectLabel ?answer WHERE {
                  ?subject wdt:P31 wd:Q11344;
                           wdt:P246 ?answer.
                  SERVICE wikibase:label { bd:serviceParam wikibase:language "ar,en". }
                }
                LIMIT 180
                """,
                false,
                true,
                false),
            new WikidataQuestionQuery(
                "authors",
                "books-literature",
                Difficulty.Medium,
                "من مؤلف كتاب {0}؟",
                """
                SELECT DISTINCT ?subject ?subjectLabel ?answer ?answerLabel WHERE {
                  ?subject wdt:P31 wd:Q7725634;
                           wdt:P50 ?answer.
                  SERVICE wikibase:label { bd:serviceParam wikibase:language "ar,en". }
                }
                LIMIT 180
                """,
                true,
                true,
                true)
        ];
    }

    private async Task<List<WikidataRow>> QueryWikidataAsync(
        HttpClient client,
        WikidataQuestionQuery query,
        CancellationToken cancellationToken)
    {
        var url =
            "https://query.wikidata.org/sparql?format=json&query=" +
            Uri.EscapeDataString(query.Sparql);

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.UserAgent.ParseAdd("SabqQuestionBankRefresh/1.0 (https://sabq.app)");

        using var response = await client.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

        var rows = new List<WikidataRow>();
        if (!document.RootElement.TryGetProperty("results", out var results) ||
            !results.TryGetProperty("bindings", out var bindings))
        {
            return rows;
        }

        foreach (var binding in bindings.EnumerateArray())
        {
            var subject = GetBindingValue(binding, "subjectLabel");
            var answer = query.AnswerFromLabel
                ? GetBindingValue(binding, "answerLabel")
                : GetBindingValue(binding, "answer");

            if (string.IsNullOrWhiteSpace(subject) || string.IsNullOrWhiteSpace(answer))
            {
                continue;
            }

            if (query.RequiresArabicSubject && !HasArabicLetters(subject))
            {
                continue;
            }

            if (query.RequiresArabicAnswer && !HasArabicLetters(answer))
            {
                continue;
            }

            rows.Add(new WikidataRow(subject.Trim(), answer.Trim()));
        }

        return rows;
    }

    private static string GetBindingValue(JsonElement binding, string propertyName)
    {
        if (!binding.TryGetProperty(propertyName, out var valueElement) ||
            !valueElement.TryGetProperty("value", out var value))
        {
            return string.Empty;
        }

        return value.GetString() ?? string.Empty;
    }

    private static bool BuildWikidataQuestion(
        WikidataQuestionQuery query,
        WikidataRow row,
        IReadOnlyList<string> answerPool,
        out ImportedQuestion question)
    {
        question = default!;

        var options = BuildOptions(row.Answer, answerPool);
        if (options.Count != 4)
        {
            return false;
        }

        var textAr = string.Format(CultureInfo.InvariantCulture, query.QuestionTemplateAr, row.Subject);
        question = new ImportedQuestion(
            Slug: BuildStableSlug("wikidata", textAr),
            CategorySlug: query.CategorySlug,
            Difficulty: query.Difficulty,
            TextAr: textAr,
            TextEn: string.Empty,
            Options: options.Select((option, index) => new ImportedOption(option, string.Empty, option == row.Answer, index + 1)).ToList(),
            Source: "Wikidata");

        return true;
    }

    private async Task<int> ImportOpenTriviaDbQuestionsAsync(
        SabqDbContext context,
        QuestionImportState state,
        QuestionBankRefreshOptions options,
        int remaining,
        CancellationToken cancellationToken)
    {
        if (remaining <= 0)
        {
            return 0;
        }

        if (!options.AllowEnglishFallback)
        {
            _logger.LogInformation(
                "OpenTDB import skipped because AllowEnglishFallback is false and no translation provider is configured");
            return 0;
        }

        var client = _httpClientFactory.CreateClient(nameof(QuestionBankRefreshScheduler));
        var imported = 0;

        foreach (var categoryId in options.OpenTriviaDb.CategoryIds)
        {
            foreach (var difficulty in options.OpenTriviaDb.Difficulties)
            {
                if (imported >= remaining)
                {
                    return imported;
                }

                var amount = Math.Clamp(options.OpenTriviaDb.AmountPerRequest, 1, 50);
                var url =
                    $"{options.OpenTriviaDb.BaseUrl}?amount={amount}&type=multiple&encode=base64&category={categoryId}&difficulty={difficulty}";

                OpenTriviaResponse? payload;
                try
                {
                    payload = await client.GetFromJsonAsync<OpenTriviaResponse>(url, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "OpenTDB request failed for category {CategoryId}", categoryId);
                    continue;
                }

                if (payload?.ResponseCode != 0 || payload.Results.Count == 0)
                {
                    continue;
                }

                foreach (var item in payload.Results)
                {
                    if (imported >= remaining)
                    {
                        return imported;
                    }

                    if (!BuildOpenTriviaQuestion(item, difficulty, out var question))
                    {
                        continue;
                    }

                    if (AddQuestion(context, state, question))
                    {
                        imported++;
                    }
                }
            }
        }

        return imported;
    }

    private static bool BuildOpenTriviaQuestion(
        OpenTriviaItem item,
        string difficulty,
        out ImportedQuestion question)
    {
        question = default!;

        if (!string.Equals(DecodeOpenTrivia(item.Type), "multiple", StringComparison.OrdinalIgnoreCase) ||
            item.IncorrectAnswers.Count != 3)
        {
            return false;
        }

        var questionEn = DecodeOpenTrivia(item.Question);
        var correct = DecodeOpenTrivia(item.CorrectAnswer);
        var incorrect = item.IncorrectAnswers.Select(DecodeOpenTrivia).ToList();
        var category = DecodeOpenTrivia(item.Category);
        var categorySlug = MapOpenTriviaCategory(category);

        if (string.IsNullOrWhiteSpace(questionEn) ||
            string.IsNullOrWhiteSpace(correct) ||
            string.IsNullOrWhiteSpace(categorySlug))
        {
            return false;
        }

        var allOptions = incorrect.Append(correct)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(_ => Random.Shared.Next())
            .ToList();

        if (allOptions.Count != 4)
        {
            return false;
        }

        question = new ImportedQuestion(
            Slug: BuildStableSlug("opentdb", questionEn),
            CategorySlug: categorySlug,
            Difficulty: ParseDifficulty(difficulty),
            TextAr: questionEn,
            TextEn: questionEn,
            Options: allOptions.Select((option, index) => new ImportedOption(option, option, option == correct, index + 1)).ToList(),
            Source: "OpenTDB");

        return true;
    }

    private async Task DiscoverGoogleSourcesAsync(
        GoogleCustomSearchOptions options,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(options.ApiKey) || string.IsNullOrWhiteSpace(options.SearchEngineId))
        {
            _logger.LogWarning("Google Custom Search is enabled but ApiKey/SearchEngineId are missing");
            return;
        }

        var client = _httpClientFactory.CreateClient(nameof(QuestionBankRefreshScheduler));

        foreach (var query in options.Queries.Where(q => !string.IsNullOrWhiteSpace(q)))
        {
            var url =
                "https://www.googleapis.com/customsearch/v1?key=" +
                Uri.EscapeDataString(options.ApiKey) +
                "&cx=" +
                Uri.EscapeDataString(options.SearchEngineId) +
                "&q=" +
                Uri.EscapeDataString(query);

            try
            {
                await using var stream = await client.GetStreamAsync(url, cancellationToken);
                using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

                if (!document.RootElement.TryGetProperty("items", out var items))
                {
                    continue;
                }

                foreach (var item in items.EnumerateArray().Take(5))
                {
                    var title = item.TryGetProperty("title", out var titleElement) ? titleElement.GetString() : "";
                    var link = item.TryGetProperty("link", out var linkElement) ? linkElement.GetString() : "";
                    _logger.LogInformation("Google source candidate: {Title} - {Url}", title, link);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Google Custom Search query failed: {Query}", query);
            }
        }
    }

    private static bool AddQuestion(SabqDbContext context, QuestionImportState state, ImportedQuestion question)
    {
        if (!IsValid(question) ||
            !state.KnownSlugs.Add(question.Slug) ||
            !state.KnownNormalizedTexts.Add(Normalize(question.TextAr)))
        {
            return false;
        }

        var category = EnsureCategory(context, state, question.CategorySlug);
        if (category == null)
        {
            return false;
        }

        var entity = new Question
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            Difficulty = question.Difficulty,
            TextAr = question.TextAr,
            TextEn = question.TextEn,
            Slug = question.Slug,
            TimeLimitSec = GetTimeLimit(question.Difficulty),
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        foreach (var option in question.Options.OrderBy(o => o.DisplayOrder))
        {
            entity.Options.Add(new Option
            {
                Id = Guid.NewGuid(),
                QuestionId = entity.Id,
                TextAr = option.TextAr,
                TextEn = option.TextEn,
                IsCorrect = option.IsCorrect,
                DisplayOrder = option.DisplayOrder
            });
        }

        context.Questions.Add(entity);
        return true;
    }

    private static Category? EnsureCategory(SabqDbContext context, QuestionImportState state, string categorySlug)
    {
        if (state.CategoriesBySlug.TryGetValue(categorySlug, out var category))
        {
            return category;
        }

        if (!CategorySeeds.TryGetValue(categorySlug, out var seed))
        {
            return null;
        }

        category = new Category
        {
            Id = Guid.NewGuid(),
            Slug = categorySlug,
            NameAr = seed.NameAr,
            NameEn = seed.NameEn,
            DisplayOrder = seed.DisplayOrder,
            IsActive = true
        };

        context.Categories.Add(category);
        state.CategoriesBySlug[categorySlug] = category;
        return category;
    }

    private static bool IsValid(ImportedQuestion question)
    {
        return !string.IsNullOrWhiteSpace(question.Slug) &&
               question.Slug.Length <= 200 &&
               !string.IsNullOrWhiteSpace(question.CategorySlug) &&
               !string.IsNullOrWhiteSpace(question.TextAr) &&
               question.TextAr.Length <= 1000 &&
               question.Options.Count == 4 &&
               question.Options.Count(o => o.IsCorrect) == 1 &&
               question.Options.All(o =>
                   !string.IsNullOrWhiteSpace(o.TextAr) &&
                   o.TextAr.Length <= 500);
    }

    private static List<string> BuildOptions(string correctAnswer, IReadOnlyList<string> answerPool)
    {
        var distractors = answerPool
            .Where(a => !string.Equals(a, correctAnswer, StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(_ => Random.Shared.Next())
            .Take(3)
            .ToList();

        if (distractors.Count != 3)
        {
            return [];
        }

        return distractors
            .Append(correctAnswer)
            .OrderBy(_ => Random.Shared.Next())
            .ToList();
    }

    private static string DecodeOpenTrivia(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        try
        {
            var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(value));
            return System.Net.WebUtility.HtmlDecode(decoded).Trim();
        }
        catch (FormatException)
        {
            return System.Net.WebUtility.HtmlDecode(value).Trim();
        }
    }

    private static string? MapOpenTriviaCategory(string category)
    {
        var normalized = category.ToLowerInvariant();

        if (normalized.Contains("general knowledge")) return "general-knowledge";
        if (normalized.Contains("art")) return "art";
        if (normalized.Contains("history")) return "history";
        if (normalized.Contains("geography")) return "geography";
        if (normalized.Contains("science") || normalized.Contains("nature") || normalized.Contains("mathematics")) return "science-nature";
        if (normalized.Contains("computer") || normalized.Contains("gadget")) return "technology";
        if (normalized.Contains("sports")) return "sports";
        if (normalized.Contains("film") || normalized.Contains("television") || normalized.Contains("cartoon")) return "film-tv";
        if (normalized.Contains("music")) return "music";
        if (normalized.Contains("books")) return "books-literature";
        if (normalized.Contains("politics")) return "politics";
        if (normalized.Contains("animals")) return "animals";
        if (normalized.Contains("vehicles")) return "vehicles";
        if (normalized.Contains("video games") || normalized.Contains("board games")) return "games";

        return "general-knowledge";
    }

    private static Difficulty ParseDifficulty(string difficulty)
    {
        return Enum.TryParse<Difficulty>(difficulty, ignoreCase: true, out var parsed)
            ? parsed
            : Difficulty.Medium;
    }

    private static int GetTimeLimit(Difficulty difficulty)
    {
        return difficulty switch
        {
            Difficulty.Easy => 15,
            Difficulty.Medium => 20,
            Difficulty.Hard => 30,
            _ => 20
        };
    }

    private static bool HasArabicLetters(string value)
    {
        return value.Any(c => c is >= '\u0600' and <= '\u06FF');
    }

    private static string BuildStableSlug(string source, string text)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(Normalize(text)));
        var hash = Convert.ToHexString(bytes).ToLowerInvariant()[..16];
        return $"{source}-{hash}";
    }

    private static string Normalize(string value)
    {
        return new string(value
            .Trim()
            .ToLowerInvariant()
            .Where(c => !char.IsWhiteSpace(c) && !char.IsPunctuation(c))
            .ToArray());
    }

    private sealed record CategorySeed(string NameAr, string NameEn, int DisplayOrder);

    private sealed record WikidataQuestionQuery(
        string Name,
        string CategorySlug,
        Difficulty Difficulty,
        string QuestionTemplateAr,
        string Sparql,
        bool AnswerFromLabel,
        bool RequiresArabicSubject,
        bool RequiresArabicAnswer);

    private sealed record WikidataRow(string Subject, string Answer);

    private sealed record ImportedQuestion(
        string Slug,
        string CategorySlug,
        Difficulty Difficulty,
        string TextAr,
        string TextEn,
        IReadOnlyList<ImportedOption> Options,
        string Source);

    private sealed record ImportedOption(
        string TextAr,
        string TextEn,
        bool IsCorrect,
        int DisplayOrder);

    private sealed class QuestionImportState
    {
        public Dictionary<string, Category> CategoriesBySlug { get; } = new(StringComparer.OrdinalIgnoreCase);
        public HashSet<string> KnownSlugs { get; } = new(StringComparer.OrdinalIgnoreCase);
        public HashSet<string> KnownNormalizedTexts { get; } = new(StringComparer.OrdinalIgnoreCase);

        public static async Task<QuestionImportState> CreateAsync(
            SabqDbContext context,
            CancellationToken cancellationToken)
        {
            var state = new QuestionImportState();

            var categories = await context.Categories.ToListAsync(cancellationToken);
            foreach (var category in categories)
            {
                state.CategoriesBySlug[category.Slug] = category;
            }

            var questions = await context.Questions
                .Select(q => new { q.Slug, q.TextAr })
                .ToListAsync(cancellationToken);

            foreach (var question in questions)
            {
                state.KnownSlugs.Add(question.Slug);
                state.KnownNormalizedTexts.Add(Normalize(question.TextAr));
            }

            return state;
        }
    }

    private sealed class OpenTriviaResponse
    {
        [JsonPropertyName("response_code")]
        public int ResponseCode { get; set; }

        [JsonPropertyName("results")]
        public List<OpenTriviaItem> Results { get; set; } = [];
    }

    private sealed class OpenTriviaItem
    {
        [JsonPropertyName("category")]
        public string Category { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("question")]
        public string Question { get; set; } = string.Empty;

        [JsonPropertyName("correct_answer")]
        public string CorrectAnswer { get; set; } = string.Empty;

        [JsonPropertyName("incorrect_answers")]
        public List<string> IncorrectAnswers { get; set; } = [];
    }
}

public sealed class QuestionBankRefreshOptions
{
    public bool Enabled { get; set; }
    public bool RunOnStartup { get; set; }
    public int IntervalDays { get; set; } = 30;
    public int MaxQuestionsPerRun { get; set; } = 100;
    public bool AllowEnglishFallback { get; set; }
    public WikidataRefreshOptions Wikidata { get; set; } = new();
    public OpenTriviaDbRefreshOptions OpenTriviaDb { get; set; } = new();
    public GoogleCustomSearchOptions GoogleCustomSearch { get; set; } = new();
}

public sealed class WikidataRefreshOptions
{
    public bool Enabled { get; set; } = true;
}

public sealed class OpenTriviaDbRefreshOptions
{
    public bool Enabled { get; set; } = true;
    public string BaseUrl { get; set; } = "https://opentdb.com/api.php";
    public int AmountPerRequest { get; set; } = 50;
    public int[] CategoryIds { get; set; } = [9, 10, 11, 12, 17, 18, 21, 22, 23, 24, 25, 27, 28, 15, 16];
    public string[] Difficulties { get; set; } = ["easy", "medium", "hard"];
}

public sealed class GoogleCustomSearchOptions
{
    public bool Enabled { get; set; }
    public string ApiKey { get; set; } = string.Empty;
    public string SearchEngineId { get; set; } = string.Empty;
    public string[] Queries { get; set; } =
    [
        "open trivia question dataset CC BY-SA",
        "Arabic trivia questions open dataset",
        "quiz questions dataset wikidata CC0"
    ];
}
