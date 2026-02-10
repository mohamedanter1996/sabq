using Microsoft.EntityFrameworkCore;
using Sabq.Infrastructure.Data;
using Sabq.Shared.DTOs;

namespace Sabq.Application.Services;

public class CategoryService
{
    private readonly SabqDbContext _context;

    public CategoryService(SabqDbContext context)
    {
        _context = context;
    }

    public async Task<List<CategoryDto>> GetActiveCategoriesAsync()
    {
        return await _context.Categories
            .Where(c => c.IsActive)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                NameAr = c.NameAr
            })
            .ToListAsync();
    }
}
