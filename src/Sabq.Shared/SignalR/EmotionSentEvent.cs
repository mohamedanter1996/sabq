namespace Sabq.Shared.SignalR;

public record EmotionSentEvent(
    Guid FromPlayerId,
    string FromPlayerName,
    Guid ToPlayerId,
    string Emotion
);
