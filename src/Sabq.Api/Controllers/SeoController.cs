using Microsoft.AspNetCore.Mvc;
using Sabq.Application.Services;

namespace Sabq.Api.Controllers;

[ApiController]
public class SeoController : ControllerBase
{
    private readonly SitemapService _sitemapService;

    public SeoController(SitemapService sitemapService)
    {
        _sitemapService = sitemapService;
    }

    /// <summary>
    /// Get the main sitemap
    /// </summary>
    [HttpGet("sitemap.xml")]
    [ResponseCache(Duration = 3600)]
    [Produces("application/xml")]
    public async Task<IActionResult> GetSitemap()
    {
        var sitemap = await _sitemapService.GenerateSitemapAsync();
        return Content(sitemap, "application/xml");
    }

    /// <summary>
    /// Get sitemap index for large sites
    /// </summary>
    [HttpGet("sitemap-index.xml")]
    [ResponseCache(Duration = 3600)]
    [Produces("application/xml")]
    public async Task<IActionResult> GetSitemapIndex()
    {
        var sitemapIndex = await _sitemapService.GenerateSitemapIndexAsync();
        return Content(sitemapIndex, "application/xml");
    }

    /// <summary>
    /// Get a specific sitemap part
    /// </summary>
    [HttpGet("sitemap-{part:int}.xml")]
    [ResponseCache(Duration = 3600)]
    [Produces("application/xml")]
    public async Task<IActionResult> GetSitemapPart(int part)
    {
        if (part < 1) return BadRequest();
        var sitemap = await _sitemapService.GenerateSitemapPartAsync(part);
        return Content(sitemap, "application/xml");
    }

    /// <summary>
    /// Get robots.txt
    /// </summary>
    [HttpGet("robots.txt")]
    [ResponseCache(Duration = 86400)] // Cache for 24 hours
    [Produces("text/plain")]
    public IActionResult GetRobotsTxt()
    {
        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var robotsTxt = $@"# Robots.txt for Sabq - سابق
# https://sabq.com

User-agent: *
Allow: /
Allow: /questions/
Allow: /about
Allow: /contact
Allow: /privacy-policy
Allow: /terms-and-conditions

# Disallow admin and API routes
Disallow: /api/
Disallow: /admin/
Disallow: /login
Disallow: /hubs/

# Sitemap
Sitemap: {baseUrl}/sitemap.xml

# Crawl-delay (optional, respected by some crawlers)
Crawl-delay: 1
";
        return Content(robotsTxt, "text/plain");
    }
}
