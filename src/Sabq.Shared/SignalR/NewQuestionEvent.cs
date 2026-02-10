using Sabq.Shared.DTOs;

namespace Sabq.Shared.SignalR;

public record NewQuestionEvent(QuestionDto Question, int QuestionNumber, int TotalQuestions);
