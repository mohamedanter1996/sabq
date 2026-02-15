using Microsoft.EntityFrameworkCore;
using Sabq.Infrastructure.Data;
using Sabq.Shared.DTOs;
using System.Text;
using System.Xml.Linq;

namespace Sabq.Application.Services;

public class SitemapService
{
    private readonly SabqDbContext _context;
    private readonly string _baseUrl;

    public SitemapService(SabqDbContext context, string baseUrl)
    {
        _context = context;
        _baseUrl = baseUrl.TrimEnd('/');
    }

    public async Task<string> GenerateSitemapAsync()
    {
        var urls = new List<SitemapUrl>();

        // Static pages
        urls.Add(new SitemapUrl { Loc = $"{_baseUrl}/", Priority = "1.0", ChangeFreq = "daily" });
        urls.Add(new SitemapUrl { Loc = $"{_baseUrl}/about", Priority = "0.8", ChangeFreq = "monthly" });
        urls.Add(new SitemapUrl { Loc = $"{_baseUrl}/contact", Priority = "0.7", ChangeFreq = "monthly" });
        urls.Add(new SitemapUrl { Loc = $"{_baseUrl}/privacy-policy", Priority = "0.5", ChangeFreq = "yearly" });
        urls.Add(new SitemapUrl { Loc = $"{_baseUrl}/terms-and-conditions", Priority = "0.5", ChangeFreq = "yearly" });
        urls.Add(new SitemapUrl { Loc = $"{_baseUrl}/questions", Priority = "0.9", ChangeFreq = "daily" });

        // Category pages
        var categories = await _context.Categories
            .Where(c => c.IsActive)
            .Select(c => new { c.Slug })
            .ToListAsync();

        foreach (var category in categories)
        {
            urls.Add(new SitemapUrl
            {
                Loc = $"{_baseUrl}/questions/{category.Slug}",
                Priority = "0.8",
                ChangeFreq = "weekly"
            });
        }

        // Question pages
        var questions = await _context.Questions
            .Include(q => q.Category)
            .Where(q => q.IsActive && q.Category.IsActive)
            .Select(q => new
            {
                CategorySlug = q.Category.Slug,
                q.Slug,
                LastModified = q.UpdatedAtUtc ?? q.CreatedAtUtc
            })
            .ToListAsync();

        foreach (var question in questions)
        {
            urls.Add(new SitemapUrl
            {
                Loc = $"{_baseUrl}/questions/{question.CategorySlug}/{question.Slug}",
                LastMod = question.LastModified,
                Priority = "0.7",
                ChangeFreq = "monthly"
            });
        }

        return GenerateSitemapXml(urls);
    }

    public async Task<string> GenerateSitemapIndexAsync()
    {
        var totalQuestions = await _context.Questions
            .Where(q => q.IsActive && q.Category.IsActive)
            .CountAsync();

        var sitemapCount = (int)Math.Ceiling(totalQuestions / 1000.0) + 1; // +1 for static pages

        var sb = new StringBuilder();
        sb.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        sb.AppendLine("<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");

        for (int i = 1; i <= sitemapCount; i++)
        {
            sb.AppendLine("  <sitemap>");
            sb.AppendLine($"    <loc>{_baseUrl}/sitemap-{i}.xml</loc>");
            sb.AppendLine($"    <lastmod>{DateTime.UtcNow:yyyy-MM-dd}</lastmod>");
            sb.AppendLine("  </sitemap>");
        }

        sb.AppendLine("</sitemapindex>");
        return sb.ToString();
    }

    public async Task<string> GenerateSitemapPartAsync(int part, int itemsPerSitemap = 1000)
    {
        var urls = new List<SitemapUrl>();
        var skip = (part - 1) * itemsPerSitemap;

        if (part == 1)
        {
            // Static pages in first sitemap
            urls.Add(new SitemapUrl { Loc = $"{_baseUrl}/", Priority = "1.0", ChangeFreq = "daily" });
            urls.Add(new SitemapUrl { Loc = $"{_baseUrl}/about", Priority = "0.8", ChangeFreq = "monthly" });
            urls.Add(new SitemapUrl { Loc = $"{_baseUrl}/contact", Priority = "0.7", ChangeFreq = "monthly" });
            urls.Add(new SitemapUrl { Loc = $"{_baseUrl}/privacy-policy", Priority = "0.5", ChangeFreq = "yearly" });
            urls.Add(new SitemapUrl { Loc = $"{_baseUrl}/terms-and-conditions", Priority = "0.5", ChangeFreq = "yearly" });
            urls.Add(new SitemapUrl { Loc = $"{_baseUrl}/questions", Priority = "0.9", ChangeFreq = "daily" });

            // Categories
            var categories = await _context.Categories
                .Where(c => c.IsActive)
                .Select(c => new { c.Slug })
                .ToListAsync();

            foreach (var category in categories)
            {
                urls.Add(new SitemapUrl
                {
                    Loc = $"{_baseUrl}/questions/{category.Slug}",
                    Priority = "0.8",
                    ChangeFreq = "weekly"
                });
            }

            skip = 0;
            itemsPerSitemap -= urls.Count;
        }

        // Questions
        var questions = await _context.Questions
            .Include(q => q.Category)
            .Where(q => q.IsActive && q.Category.IsActive)
            .OrderBy(q => q.Id)
            .Skip(skip)
            .Take(itemsPerSitemap)
            .Select(q => new
            {
                CategorySlug = q.Category.Slug,
                q.Slug,
                LastModified = q.UpdatedAtUtc ?? q.CreatedAtUtc
            })
            .ToListAsync();

        foreach (var question in questions)
        {
            urls.Add(new SitemapUrl
            {
                Loc = $"{_baseUrl}/questions/{question.CategorySlug}/{question.Slug}",
                LastMod = question.LastModified,
                Priority = "0.7",
                ChangeFreq = "monthly"
            });
        }

        return GenerateSitemapXml(urls);
    }

    private string GenerateSitemapXml(List<SitemapUrl> urls)
    {
        var sb = new StringBuilder();
        sb.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        sb.AppendLine("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");

        foreach (var url in urls)
        {
            sb.AppendLine("  <url>");
            sb.AppendLine($"    <loc>{EscapeXml(url.Loc)}</loc>");
            
            if (url.LastMod.HasValue)
            {
                sb.AppendLine($"    <lastmod>{url.LastMod.Value:yyyy-MM-dd}</lastmod>");
            }
            
            sb.AppendLine($"    <changefreq>{url.ChangeFreq}</changefreq>");
            sb.AppendLine($"    <priority>{url.Priority}</priority>");
            sb.AppendLine("  </url>");
        }

        sb.AppendLine("</urlset>");
        return sb.ToString();
    }

    private static string EscapeXml(string text)
    {
        return text
            .Replace("&", "&amp;")
            .Replace("<", "&lt;")
            .Replace(">", "&gt;")
            .Replace("\"", "&quot;")
            .Replace("'", "&apos;");
    }
}
