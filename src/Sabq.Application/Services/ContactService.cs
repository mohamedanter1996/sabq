using Microsoft.EntityFrameworkCore;
using Sabq.Domain.Entities;
using Sabq.Infrastructure.Data;
using Sabq.Shared.DTOs;

namespace Sabq.Application.Services;

public class ContactService
{
    private readonly SabqDbContext _context;

    public ContactService(SabqDbContext context)
    {
        _context = context;
    }

    public async Task<ContactMessageResponse> SubmitContactMessageAsync(
        ContactMessageRequest request, 
        string? ipAddress = null, 
        string? userAgent = null)
    {
        var message = new ContactMessage
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Email = request.Email.Trim().ToLower(),
            Message = request.Message.Trim(),
            CreatedAtUtc = DateTime.UtcNow,
            IpAddress = ipAddress,
            UserAgent = userAgent?.Length > 500 ? userAgent[..500] : userAgent
        };

        _context.ContactMessages.Add(message);
        await _context.SaveChangesAsync();

        return new ContactMessageResponse
        {
            Success = true,
            MessageAr = "تم إرسال رسالتك بنجاح. سنتواصل معك قريباً.",
            MessageEn = "Your message has been sent successfully. We will contact you soon."
        };
    }

    public async Task<PaginatedResponse<ContactMessageDto>> GetMessagesAsync(
        int pageNumber = 1, 
        int pageSize = 20, 
        bool? isRead = null)
    {
        var query = _context.ContactMessages.AsQueryable();

        if (isRead.HasValue)
        {
            query = query.Where(m => m.IsRead == isRead.Value);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(m => m.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new ContactMessageDto
            {
                Id = m.Id,
                Name = m.Name,
                Email = m.Email,
                Message = m.Message,
                CreatedAtUtc = m.CreatedAtUtc,
                IsRead = m.IsRead,
                IsReplied = m.IsReplied,
                ReplyText = m.ReplyText,
                RepliedAtUtc = m.RepliedAtUtc
            })
            .ToListAsync();

        return new PaginatedResponse<ContactMessageDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<bool> MarkAsReadAsync(Guid messageId)
    {
        var message = await _context.ContactMessages.FindAsync(messageId);
        if (message == null) return false;

        message.IsRead = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReplyToMessageAsync(Guid messageId, string replyText)
    {
        var message = await _context.ContactMessages.FindAsync(messageId);
        if (message == null) return false;

        message.IsReplied = true;
        message.ReplyText = replyText;
        message.RepliedAtUtc = DateTime.UtcNow;
        message.IsRead = true;
        await _context.SaveChangesAsync();
        return true;
    }
}
