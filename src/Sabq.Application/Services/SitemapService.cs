using Sabq.Infrastructure.Data;
using Sabq.Shared.DTOs;
using System.Text;
using System.Xml.Linq;

namespace Sabq.Application.Services;

public class SitemapService
{
    private readonly string _baseUrl;

    // Keep the DbContext constructor parameter for the existing DI registration;
    // sitemap generation no longer derives public URLs from the question bank.
    public SitemapService(SabqDbContext _, string baseUrl)
    {
        _baseUrl = baseUrl.TrimEnd('/');
    }

    public Task<string> GenerateSitemapAsync()
    {
        return Task.FromResult(GenerateSitemapXml(CreatePublicUrls()));
    }

    public Task<string> GenerateSitemapIndexAsync()
    {
        var sb = new StringBuilder();
        sb.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        sb.AppendLine("<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");
        sb.AppendLine("  <sitemap>");
        sb.AppendLine($"    <loc>{_baseUrl}/sitemap-1.xml</loc>");
        sb.AppendLine($"    <lastmod>{DateTime.UtcNow:yyyy-MM-dd}</lastmod>");
        sb.AppendLine("  </sitemap>");
        sb.AppendLine("</sitemapindex>");
        return Task.FromResult(sb.ToString());
    }

    public Task<string> GenerateSitemapPartAsync(int part, int itemsPerSitemap = 1000)
    {
        var urls = part == 1 ? CreatePublicUrls() : new List<SitemapUrl>();
        return Task.FromResult(GenerateSitemapXml(urls));
    }

    private List<SitemapUrl> CreatePublicUrls()
    {
        return new List<SitemapUrl>
        {
            new() { Loc = $"{_baseUrl}/", Priority = "1.0", ChangeFreq = "daily" },
            new() { Loc = $"{_baseUrl}/about", Priority = "0.8", ChangeFreq = "monthly" },
            new() { Loc = $"{_baseUrl}/contact", Priority = "0.7", ChangeFreq = "monthly" },
            new() { Loc = $"{_baseUrl}/privacy-policy", Priority = "0.5", ChangeFreq = "yearly" },
            new() { Loc = $"{_baseUrl}/terms-and-conditions", Priority = "0.5", ChangeFreq = "yearly" },
            new() { Loc = $"{_baseUrl}/editorial-policy", Priority = "0.7", ChangeFreq = "monthly" },
            new() { Loc = $"{_baseUrl}/corrections", Priority = "0.6", ChangeFreq = "monthly" },
            new() { Loc = $"{_baseUrl}/team", Priority = "0.6", ChangeFreq = "monthly" },
            new() { Loc = $"{_baseUrl}/learn", Priority = "0.9", ChangeFreq = "weekly" },
            new() { Loc = $"{_baseUrl}/learn/arabic-language-basics", Priority = "0.8", ChangeFreq = "monthly" },
            new() { Loc = $"{_baseUrl}/learn/math-and-logic", Priority = "0.8", ChangeFreq = "monthly" },
            new() { Loc = $"{_baseUrl}/learn/science-around-us", Priority = "0.8", ChangeFreq = "monthly" },
            new() { Loc = $"{_baseUrl}/learn/life-science", Priority = "0.8", ChangeFreq = "monthly" },
            new() { Loc = $"{_baseUrl}/learn/earth-and-space", Priority = "0.8", ChangeFreq = "monthly" },
            new() { Loc = $"{_baseUrl}/learn/climate-and-water", Priority = "0.8", ChangeFreq = "monthly" },
            new() { Loc = $"{_baseUrl}/learn/digital-citizenship", Priority = "0.8", ChangeFreq = "monthly" },
            new() { Loc = $"{_baseUrl}/learn/world-geography", Priority = "0.8", ChangeFreq = "monthly" },
            new() { Loc = $"{_baseUrl}/learn/egyptian-heritage", Priority = "0.8", ChangeFreq = "monthly" },
            new() { Loc = $"{_baseUrl}/learn/arab-scientific-heritage", Priority = "0.8", ChangeFreq = "monthly" },
            new() { Loc = $"{_baseUrl}/learn/historical-thinking", Priority = "0.8", ChangeFreq = "monthly" },
            new() { Loc = $"{_baseUrl}/learn/reading-and-research", Priority = "0.8", ChangeFreq = "monthly" }
        };
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
