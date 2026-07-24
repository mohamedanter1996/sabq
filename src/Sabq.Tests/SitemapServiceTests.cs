using Microsoft.EntityFrameworkCore;
using Sabq.Application.Services;
using Sabq.Infrastructure.Data;
using Xunit;

namespace Sabq.Tests;

public class SitemapServiceTests
{
    [Fact]
    public async Task GenerateSitemapAsync_ListsOnlyCuratedPublicPages()
    {
        await using var context = CreateContext();
        var service = new SitemapService(context, "https://sabiqgame.com/");

        var sitemap = await service.GenerateSitemapAsync();

        Assert.DoesNotContain("/questions", sitemap, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("<loc>https://sabiqgame.com//</loc>", sitemap, StringComparison.Ordinal);
        Assert.Contains("<loc>https://sabiqgame.com/learn</loc>", sitemap, StringComparison.Ordinal);
        Assert.Contains("<loc>https://sabiqgame.com/learn/reading-and-research</loc>", sitemap, StringComparison.Ordinal);
        Assert.Equal(21, CountLocations(sitemap));
    }

    [Fact]
    public async Task GenerateSitemapIndexAsync_HasOnlyTheStaticPart()
    {
        await using var context = CreateContext();
        var service = new SitemapService(context, "https://sabiqgame.com");

        var sitemapIndex = await service.GenerateSitemapIndexAsync();

        Assert.Contains("https://sabiqgame.com/sitemap-1.xml", sitemapIndex, StringComparison.Ordinal);
        Assert.DoesNotContain("sitemap-2.xml", sitemapIndex, StringComparison.Ordinal);
    }

    private static SabqDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<SabqDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new SabqDbContext(options);
    }

    private static int CountLocations(string xml)
    {
        return xml.Split("<loc>", StringSplitOptions.None).Length - 1;
    }
}
