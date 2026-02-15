using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Sabq.Application.Services;
using Sabq.Application.Validators;
using Sabq.Shared.DTOs;

namespace Sabq.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactController : ControllerBase
{
    private readonly ContactService _contactService;
    private readonly IValidator<ContactMessageRequest> _validator;

    public ContactController(ContactService contactService, IValidator<ContactMessageRequest> validator)
    {
        _contactService = contactService;
        _validator = validator;
    }

    /// <summary>
    /// Submit a contact message
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ContactMessageResponse), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<ActionResult<ContactMessageResponse>> SubmitMessage([FromBody] ContactMessageRequest request)
    {
        var validationResult = await _validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return BadRequest(new ContactMessageResponse
            {
                Success = false,
                MessageAr = string.Join(" | ", validationResult.Errors.Select(e => e.ErrorMessage)),
                MessageEn = string.Join(" | ", validationResult.Errors.Select(e => e.ErrorMessage))
            });
        }

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();

        var response = await _contactService.SubmitContactMessageAsync(request, ipAddress, userAgent);
        return Ok(response);
    }

    /// <summary>
    /// Get all contact messages (Admin only)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<ContactMessageDto>), 200)]
    // [Authorize(Policy = "Admin")] // Uncomment when admin auth is configured
    public async Task<ActionResult<PaginatedResponse<ContactMessageDto>>> GetMessages(
        [FromQuery] int pageNumber = 1, 
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? isRead = null)
    {
        var response = await _contactService.GetMessagesAsync(pageNumber, pageSize, isRead);
        return Ok(response);
    }

    /// <summary>
    /// Mark a message as read (Admin only)
    /// </summary>
    [HttpPut("{id:guid}/read")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    // [Authorize(Policy = "Admin")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var success = await _contactService.MarkAsReadAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }

    /// <summary>
    /// Reply to a message (Admin only)
    /// </summary>
    [HttpPost("{id:guid}/reply")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    // [Authorize(Policy = "Admin")]
    public async Task<IActionResult> Reply(Guid id, [FromBody] ReplyRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ReplyText))
            return BadRequest("Reply text is required");

        var success = await _contactService.ReplyToMessageAsync(id, request.ReplyText);
        if (!success) return NotFound();
        return NoContent();
    }
}

public class ReplyRequest
{
    public string ReplyText { get; set; } = string.Empty;
}
