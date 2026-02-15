using Microsoft.EntityFrameworkCore;
using Sabq.Application.Services;
using Sabq.Domain.Entities;
using Sabq.Infrastructure.Data;
using Sabq.Shared.DTOs;
using Xunit;

namespace Sabq.Tests;

/// <summary>
/// Tests for ContactService functionality.
/// </summary>
public class ContactServiceTests
{
    private static DbContextOptions<SabqDbContext> CreateInMemoryOptions()
    {
        return new DbContextOptionsBuilder<SabqDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    /// <summary>
    /// Tests that submitting a contact message creates a new record.
    /// </summary>
    [Fact]
    public async Task SubmitContactMessage_CreatesNewRecord()
    {
        // Arrange
        var options = CreateInMemoryOptions();
        using var context = new SabqDbContext(options);
        var service = new ContactService(context);
        
        var request = new ContactMessageRequest
        {
            Name = "Test User",
            Email = "test@example.com",
            Message = "This is a test message."
        };

        // Act
        var response = await service.SubmitContactMessageAsync(request, "127.0.0.1", "TestAgent");

        // Assert
        Assert.True(response.Success);
        Assert.NotEmpty(response.MessageAr);
        Assert.NotEmpty(response.MessageEn);

        var savedMessage = await context.ContactMessages.FirstOrDefaultAsync();
        Assert.NotNull(savedMessage);
        Assert.Equal("Test User", savedMessage.Name);
        Assert.Equal("test@example.com", savedMessage.Email);
        Assert.Equal("This is a test message.", savedMessage.Message);
        Assert.Equal("127.0.0.1", savedMessage.IpAddress);
        Assert.False(savedMessage.IsRead);
        Assert.False(savedMessage.IsReplied);
    }

    /// <summary>
    /// Tests that email is stored in lowercase.
    /// </summary>
    [Fact]
    public async Task SubmitContactMessage_EmailIsLowercased()
    {
        // Arrange
        var options = CreateInMemoryOptions();
        using var context = new SabqDbContext(options);
        var service = new ContactService(context);
        
        var request = new ContactMessageRequest
        {
            Name = "Test",
            Email = "TEST@EXAMPLE.COM",
            Message = "Test message here."
        };

        // Act
        await service.SubmitContactMessageAsync(request);

        // Assert
        var savedMessage = await context.ContactMessages.FirstOrDefaultAsync();
        Assert.Equal("test@example.com", savedMessage?.Email);
    }

    /// <summary>
    /// Tests that marking a message as read updates the IsRead flag.
    /// </summary>
    [Fact]
    public async Task MarkAsRead_UpdatesIsReadFlag()
    {
        // Arrange
        var options = CreateInMemoryOptions();
        using var context = new SabqDbContext(options);
        
        var messageId = Guid.NewGuid();
        var message = new ContactMessage
        {
            Id = messageId,
            Name = "Test",
            Email = "test@test.com",
            Message = "Test message",
            IsRead = false
        };
        context.ContactMessages.Add(message);
        await context.SaveChangesAsync();

        var service = new ContactService(context);

        // Act
        var result = await service.MarkAsReadAsync(messageId);

        // Assert
        Assert.True(result);
        var updatedMessage = await context.ContactMessages.FindAsync(messageId);
        Assert.True(updatedMessage?.IsRead);
    }

    /// <summary>
    /// Tests that marking non-existent message returns false.
    /// </summary>
    [Fact]
    public async Task MarkAsRead_NonExistentMessage_ReturnsFalse()
    {
        // Arrange
        var options = CreateInMemoryOptions();
        using var context = new SabqDbContext(options);
        var service = new ContactService(context);

        // Act
        var result = await service.MarkAsReadAsync(Guid.NewGuid());

        // Assert
        Assert.False(result);
    }

    /// <summary>
    /// Tests that replying to a message updates the reply fields.
    /// </summary>
    [Fact]
    public async Task ReplyToMessage_UpdatesReplyFields()
    {
        // Arrange
        var options = CreateInMemoryOptions();
        using var context = new SabqDbContext(options);
        
        var messageId = Guid.NewGuid();
        var message = new ContactMessage
        {
            Id = messageId,
            Name = "Test",
            Email = "test@test.com",
            Message = "Test message",
            IsRead = false,
            IsReplied = false
        };
        context.ContactMessages.Add(message);
        await context.SaveChangesAsync();

        var service = new ContactService(context);
        var replyText = "Thank you for your message!";

        // Act
        var result = await service.ReplyToMessageAsync(messageId, replyText);

        // Assert
        Assert.True(result);
        var updatedMessage = await context.ContactMessages.FindAsync(messageId);
        Assert.True(updatedMessage?.IsReplied);
        Assert.True(updatedMessage?.IsRead);
        Assert.Equal(replyText, updatedMessage?.ReplyText);
        Assert.NotNull(updatedMessage?.RepliedAtUtc);
    }

    /// <summary>
    /// Tests pagination of messages.
    /// </summary>
    [Fact]
    public async Task GetMessages_ReturnsPaginatedResults()
    {
        // Arrange
        var options = CreateInMemoryOptions();
        using var context = new SabqDbContext(options);
        
        // Add 25 messages
        for (int i = 0; i < 25; i++)
        {
            context.ContactMessages.Add(new ContactMessage
            {
                Id = Guid.NewGuid(),
                Name = $"User {i}",
                Email = $"user{i}@test.com",
                Message = $"Message {i}",
                CreatedAtUtc = DateTime.UtcNow.AddHours(-i)
            });
        }
        await context.SaveChangesAsync();

        var service = new ContactService(context);

        // Act
        var page1 = await service.GetMessagesAsync(1, 10);
        var page2 = await service.GetMessagesAsync(2, 10);
        var page3 = await service.GetMessagesAsync(3, 10);

        // Assert
        Assert.Equal(25, page1.TotalCount);
        Assert.Equal(10, page1.Items.Count);
        Assert.Equal(10, page2.Items.Count);
        Assert.Equal(5, page3.Items.Count);
        Assert.Equal(1, page1.PageNumber);
        Assert.Equal(3, page1.TotalPages);
    }

    /// <summary>
    /// Tests filtering messages by read status.
    /// </summary>
    [Fact]
    public async Task GetMessages_FiltersByReadStatus()
    {
        // Arrange
        var options = CreateInMemoryOptions();
        using var context = new SabqDbContext(options);
        
        // Add 5 read and 5 unread messages
        for (int i = 0; i < 10; i++)
        {
            context.ContactMessages.Add(new ContactMessage
            {
                Id = Guid.NewGuid(),
                Name = $"User {i}",
                Email = $"user{i}@test.com",
                Message = $"Message {i}",
                IsRead = i < 5
            });
        }
        await context.SaveChangesAsync();

        var service = new ContactService(context);

        // Act
        var readMessages = await service.GetMessagesAsync(1, 20, isRead: true);
        var unreadMessages = await service.GetMessagesAsync(1, 20, isRead: false);

        // Assert
        Assert.Equal(5, readMessages.TotalCount);
        Assert.Equal(5, unreadMessages.TotalCount);
        Assert.All(readMessages.Items, m => Assert.True(m.IsRead));
        Assert.All(unreadMessages.Items, m => Assert.False(m.IsRead));
    }
}
