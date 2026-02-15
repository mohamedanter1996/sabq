using FluentValidation;
using Sabq.Shared.DTOs;

namespace Sabq.Application.Validators;

public class ContactMessageRequestValidator : AbstractValidator<ContactMessageRequest>
{
    public ContactMessageRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("الاسم مطلوب / Name is required")
            .MinimumLength(2).WithMessage("الاسم يجب أن يكون حرفين على الأقل / Name must be at least 2 characters")
            .MaximumLength(100).WithMessage("الاسم يجب ألا يتجاوز 100 حرف / Name must not exceed 100 characters");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("البريد الإلكتروني مطلوب / Email is required")
            .EmailAddress().WithMessage("البريد الإلكتروني غير صالح / Invalid email address")
            .MaximumLength(200).WithMessage("البريد الإلكتروني يجب ألا يتجاوز 200 حرف / Email must not exceed 200 characters");

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("الرسالة مطلوبة / Message is required")
            .MinimumLength(10).WithMessage("الرسالة يجب أن تكون 10 أحرف على الأقل / Message must be at least 10 characters")
            .MaximumLength(2000).WithMessage("الرسالة يجب ألا تتجاوز 2000 حرف / Message must not exceed 2000 characters");
    }
}

public class QuestionListRequestValidator : AbstractValidator<QuestionListRequest>
{
    private static readonly string[] ValidDifficulties = { "easy", "medium", "hard" };

    public QuestionListRequestValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1).WithMessage("رقم الصفحة يجب أن يكون 1 أو أكثر / Page number must be 1 or greater");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("حجم الصفحة يجب أن يكون بين 1 و 100 / Page size must be between 1 and 100");

        RuleFor(x => x.CategorySlug)
            .MaximumLength(100).WithMessage("اسم التصنيف طويل جدًا / Category slug is too long")
            .Matches(@"^[a-z0-9\u0600-\u06FF\-]*$").When(x => !string.IsNullOrEmpty(x.CategorySlug))
            .WithMessage("اسم التصنيف يحتوي على أحرف غير صالحة / Category slug contains invalid characters");

        RuleFor(x => x.Difficulty)
            .Must(d => string.IsNullOrEmpty(d) || ValidDifficulties.Contains(d.ToLower()))
            .WithMessage("مستوى الصعوبة يجب أن يكون: easy, medium, hard / Difficulty must be: easy, medium, hard");

        RuleFor(x => x.SearchTerm)
            .MaximumLength(200).WithMessage("البحث طويل جدًا / Search term is too long");
    }
}
