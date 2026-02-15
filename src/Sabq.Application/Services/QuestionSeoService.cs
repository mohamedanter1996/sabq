using Microsoft.EntityFrameworkCore;
using Sabq.Infrastructure.Data;
using Sabq.Shared.DTOs;
using System.Text.RegularExpressions;

namespace Sabq.Application.Services;

public class QuestionSeoService
{
    private readonly SabqDbContext _context;

    public QuestionSeoService(SabqDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResponse<QuestionSeoDto>> GetQuestionsAsync(QuestionListRequest request)
    {
        var query = _context.Questions
            .Include(q => q.Category)
            .Include(q => q.Options)
            .Where(q => q.IsActive);

        // Filter by category
        if (!string.IsNullOrEmpty(request.CategorySlug))
        {
            query = query.Where(q => q.Category.Slug == request.CategorySlug);
        }

        // Filter by difficulty
        if (!string.IsNullOrEmpty(request.Difficulty) && 
            Enum.TryParse<Sabq.Domain.Enums.Difficulty>(request.Difficulty, true, out var difficulty))
        {
            query = query.Where(q => q.Difficulty == difficulty);
        }

        // Search
        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLower();
            query = query.Where(q => 
                q.TextAr.ToLower().Contains(searchTerm) || 
                q.TextEn.ToLower().Contains(searchTerm));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(q => q.Category.DisplayOrder)
            .ThenBy(q => q.Id)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(q => new QuestionSeoDto
            {
                Id = q.Id,
                TextAr = q.TextAr,
                TextEn = q.TextEn,
                Slug = q.Slug,
                CategorySlug = q.Category.Slug,
                CategoryNameAr = q.Category.NameAr,
                CategoryNameEn = q.Category.NameEn,
                Difficulty = q.Difficulty.ToString(),
                TimeLimitSec = q.TimeLimitSec,
                LastModified = q.UpdatedAtUtc ?? q.CreatedAtUtc,
                Options = q.Options.OrderBy(o => o.DisplayOrder).Select(o => new OptionSeoDto
                {
                    Id = o.Id,
                    TextAr = o.TextAr,
                    TextEn = o.TextEn,
                    IsCorrect = o.IsCorrect
                }).ToList()
            })
            .ToListAsync();

        return new PaginatedResponse<QuestionSeoDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    public async Task<QuestionSeoDto?> GetQuestionBySlugAsync(string categorySlug, string questionSlug)
    {
        var question = await _context.Questions
            .Include(q => q.Category)
            .Include(q => q.Options)
            .Where(q => q.IsActive && q.Category.Slug == categorySlug && q.Slug == questionSlug)
            .Select(q => new QuestionSeoDto
            {
                Id = q.Id,
                TextAr = q.TextAr,
                TextEn = q.TextEn,
                Slug = q.Slug,
                CategorySlug = q.Category.Slug,
                CategoryNameAr = q.Category.NameAr,
                CategoryNameEn = q.Category.NameEn,
                Difficulty = q.Difficulty.ToString(),
                TimeLimitSec = q.TimeLimitSec,
                LastModified = q.UpdatedAtUtc ?? q.CreatedAtUtc,
                Options = q.Options.OrderBy(o => o.DisplayOrder).Select(o => new OptionSeoDto
                {
                    Id = o.Id,
                    TextAr = o.TextAr,
                    TextEn = o.TextEn,
                    IsCorrect = o.IsCorrect
                }).ToList()
            })
            .FirstOrDefaultAsync();

        return question;
    }

    public async Task<List<CategoryDto>> GetCategoriesWithCountAsync()
    {
        return await _context.Categories
            .Where(c => c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                NameAr = c.NameAr,
                NameEn = c.NameEn,
                Slug = c.Slug,
                Description = c.Description,
                QuestionCount = c.Questions.Count(q => q.IsActive)
            })
            .ToListAsync();
    }

    public static string GenerateSlug(string text)
    {
        if (string.IsNullOrEmpty(text))
            return Guid.NewGuid().ToString("N")[..8];

        // Convert to lowercase
        var slug = text.ToLower();

        // Remove diacritics and special Arabic characters
        slug = Regex.Replace(slug, @"[\u064B-\u065F]", ""); // Arabic diacritics

        // Replace spaces and special characters with hyphens
        slug = Regex.Replace(slug, @"[^a-z0-9\u0600-\u06FF\-]", "-");

        // Replace multiple hyphens with single hyphen
        slug = Regex.Replace(slug, @"-+", "-");

        // Trim hyphens from start and end
        slug = slug.Trim('-');

        // Limit length
        if (slug.Length > 100)
            slug = slug[..100].TrimEnd('-');

        // If empty, generate a random slug
        if (string.IsNullOrEmpty(slug))
            slug = Guid.NewGuid().ToString("N")[..8];

        return slug;
    }
}
