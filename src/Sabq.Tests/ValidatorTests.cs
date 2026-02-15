using Sabq.Application.Validators;
using Sabq.Shared.DTOs;
using Xunit;

namespace Sabq.Tests;

/// <summary>
/// Unit tests for FluentValidation validators
/// </summary>
public class ValidatorTests
{
    private readonly ContactMessageRequestValidator _contactValidator;
    private readonly QuestionListRequestValidator _questionListValidator;

    public ValidatorTests()
    {
        _contactValidator = new ContactMessageRequestValidator();
        _questionListValidator = new QuestionListRequestValidator();
    }

    #region ContactMessageRequestValidator Tests

    [Fact]
    public void ContactValidator_ValidRequest_ShouldPass()
    {
        // Arrange
        var request = new ContactMessageRequest
        {
            Name = "أحمد",
            Email = "test@example.com",
            Message = "هذه رسالة اختبار للتواصل"
        };

        // Act
        var result = _contactValidator.Validate(request);

        // Assert
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void ContactValidator_EmptyName_ShouldFail(string? name)
    {
        // Arrange
        var request = new ContactMessageRequest
        {
            Name = name!,
            Email = "test@example.com",
            Message = "رسالة صالحة للاختبار"
        };

        // Act
        var result = _contactValidator.Validate(request);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Name");
    }

    [Fact]
    public void ContactValidator_NameTooLong_ShouldFail()
    {
        // Arrange
        var request = new ContactMessageRequest
        {
            Name = new string('أ', 101),
            Email = "test@example.com",
            Message = "رسالة صالحة للاختبار"
        };

        // Act
        var result = _contactValidator.Validate(request);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Name");
    }

    [Theory]
    [InlineData("invalid-email")]
    [InlineData("test@")]
    [InlineData("@example.com")]
    public void ContactValidator_InvalidEmail_ShouldFail(string email)
    {
        // Arrange
        var request = new ContactMessageRequest
        {
            Name = "أحمد",
            Email = email,
            Message = "رسالة صالحة للاختبار"
        };

        // Act
        var result = _contactValidator.Validate(request);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Email");
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void ContactValidator_EmptyMessage_ShouldFail(string? message)
    {
        // Arrange
        var request = new ContactMessageRequest
        {
            Name = "أحمد",
            Email = "test@example.com",
            Message = message!
        };

        // Act
        var result = _contactValidator.Validate(request);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Message");
    }

    [Fact]
    public void ContactValidator_MessageTooShort_ShouldFail()
    {
        // Arrange
        var request = new ContactMessageRequest
        {
            Name = "أحمد",
            Email = "test@example.com",
            Message = "قصير"
        };

        // Act
        var result = _contactValidator.Validate(request);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Message");
    }

    #endregion

    #region QuestionListRequestValidator Tests

    [Fact]
    public void QuestionListValidator_ValidRequest_ShouldPass()
    {
        // Arrange
        var request = new QuestionListRequest
        {
            PageNumber = 1,
            PageSize = 10
        };

        // Act
        var result = _questionListValidator.Validate(request);

        // Assert
        Assert.True(result.IsValid);
    }

    [Fact]
    public void QuestionListValidator_PageLessThanOne_AutoCorrectsThenPasses()
    {
        // PaginatedRequest auto-corrects PageNumber < 1 to 1
        // So validator will see the corrected value
        var request = new QuestionListRequest
        {
            PageNumber = 0, // Gets auto-corrected to 1
            PageSize = 10
        };

        // Act
        var result = _questionListValidator.Validate(request);

        // Assert - Passes because setter auto-corrected
        Assert.True(result.IsValid);
        Assert.Equal(1, request.PageNumber);
    }

    [Fact]
    public void QuestionListValidator_PageSizeTooSmall_AutoCorrectsThenPasses()
    {
        // PaginatedRequest auto-corrects PageSize < 1 to 20
        var request = new QuestionListRequest
        {
            PageNumber = 1,
            PageSize = 0 // Gets auto-corrected to 20
        };

        // Act
        var result = _questionListValidator.Validate(request);

        // Assert - Passes because setter auto-corrected
        Assert.True(result.IsValid);
        Assert.Equal(20, request.PageSize);
    }

    [Fact]
    public void QuestionListValidator_PageSizeTooLarge_AutoCorrectsThenPasses()
    {
        // PaginatedRequest auto-corrects PageSize > 100 to 100
        var request = new QuestionListRequest
        {
            PageNumber = 1,
            PageSize = 200 // Gets auto-corrected to 100
        };

        // Act
        var result = _questionListValidator.Validate(request);

        // Assert - Passes because setter auto-corrected
        Assert.True(result.IsValid);
        Assert.Equal(100, request.PageSize);
    }

    [Fact]
    public void QuestionListValidator_WithOptionalFilters_ShouldPass()
    {
        // Arrange
        var request = new QuestionListRequest
        {
            PageNumber = 2,
            PageSize = 20,
            CategorySlug = "science",
            Difficulty = "Medium",
            SearchTerm = "فيزياء"
        };

        // Act
        var result = _questionListValidator.Validate(request);

        // Assert
        Assert.True(result.IsValid);
    }

    #endregion
}
