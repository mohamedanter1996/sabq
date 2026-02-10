namespace Sabq.Shared.SignalR;

public record AnswerResultEvent(Guid PlayerId, bool IsCorrect, int DeltaScore, int UpdatedScore);
