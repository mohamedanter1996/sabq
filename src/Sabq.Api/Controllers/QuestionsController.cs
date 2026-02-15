using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Sabq.Application.Services;
using Sabq.Shared.DTOs;

namespace Sabq.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuestionsController : ControllerBase
{
    private readonly QuestionSeoService _questionService;
    private readonly IValidator<QuestionListRequest> _validator;

    public QuestionsController(QuestionSeoService questionService, IValidator<QuestionListRequest> validator)
    {
        _questionService = questionService;
        _validator = validator;
    }

    /// <summary>
    /// Get paginated list of questions for SEO
    /// </summary>
    [HttpGet]
    [ResponseCache(Duration = 300, VaryByQueryKeys = new[] { "pageNumber", "pageSize", "categorySlug", "difficulty", "searchTerm" })]
    [ProducesResponseType(typeof(PaginatedResponse<QuestionSeoDto>), 200)]
    [ProducesResponseType(typeof(ValidationProblemDetails), 400)]
    public async Task<ActionResult<PaginatedResponse<QuestionSeoDto>>> GetQuestions([FromQuery] QuestionListRequest request)
    {
        var validationResult = await _validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }));
        }

        var response = await _questionService.GetQuestionsAsync(request);
        return Ok(response);
    }

    /// <summary>
    /// Get a question by category and slug for SEO
    /// </summary>
    [HttpGet("{categorySlug}/{questionSlug}")]
    [ResponseCache(Duration = 3600)]
    [ProducesResponseType(typeof(QuestionSeoDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<QuestionSeoDto>> GetQuestion(string categorySlug, string questionSlug)
    {
        var question = await _questionService.GetQuestionBySlugAsync(categorySlug, questionSlug);
        if (question == null)
            return NotFound();

        return Ok(question);
    }

    /// <summary>
    /// Get categories with question counts
    /// </summary>
    [HttpGet("categories")]
    [ResponseCache(Duration = 600)]
    [ProducesResponseType(typeof(List<CategoryDto>), 200)]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
    {
        var categories = await _questionService.GetCategoriesWithCountAsync();
        return Ok(categories);
    }
}
