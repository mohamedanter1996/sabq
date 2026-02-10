using Microsoft.AspNetCore.SignalR.Client;
using Sabq.Shared.DTOs;
using Sabq.Shared.SignalR;

namespace Sabq.Mobile.Services;

public class SignalRService
{
    private readonly PreferencesService _preferences;
    private HubConnection? _hubConnection;

#if ANDROID
    private const string BaseUrl = "http://10.0.2.2:5000";
#elif WINDOWS
    private const string BaseUrl = "http://localhost:5000";
#else
    private const string BaseUrl = "http://localhost:5000";
#endif

    public event EventHandler<RoomSnapshot>? RoomSnapshotReceived;
    public event EventHandler<PlayerJoinedEvent>? PlayerJoined;
    public event EventHandler<GameStartedEvent>? GameStarted;
    public event EventHandler<NewQuestionEvent>? NewQuestion;
    public event EventHandler<AnswerResultEvent>? AnswerResult;
    public event EventHandler<ScoresUpdatedEvent>? ScoresUpdated;
    public event EventHandler<QuestionEndedEvent>? QuestionEnded;
    public event EventHandler<GameEndedEvent>? GameEnded;
    public event EventHandler<string>? Error;

    public bool IsConnected => _hubConnection?.State == HubConnectionState.Connected;

    public SignalRService(PreferencesService preferences)
    {
        _preferences = preferences;
    }

    public async Task ConnectAsync()
    {
        if (_hubConnection != null)
        {
            await DisconnectAsync();
        }

        _hubConnection = new HubConnectionBuilder()
            .WithUrl($"{BaseUrl}/hubs/sabq", options =>
            {
                options.AccessTokenProvider = () => Task.FromResult(_preferences.Token);
            })
            .WithAutomaticReconnect()
            .Build();

        // Register handlers
        _hubConnection.On<RoomSnapshot>("RoomSnapshot", snapshot =>
        {
            RoomSnapshotReceived?.Invoke(this, snapshot);
        });

        _hubConnection.On<PlayerJoinedEvent>("PlayerJoined", evt =>
        {
            PlayerJoined?.Invoke(this, evt);
        });

        _hubConnection.On<GameStartedEvent>("GameStarted", evt =>
        {
            GameStarted?.Invoke(this, evt);
        });

        _hubConnection.On<NewQuestionEvent>("NewQuestion", evt =>
        {
            NewQuestion?.Invoke(this, evt);
        });

        _hubConnection.On<AnswerResultEvent>("AnswerResult", evt =>
        {
            AnswerResult?.Invoke(this, evt);
        });

        _hubConnection.On<ScoresUpdatedEvent>("ScoresUpdated", evt =>
        {
            ScoresUpdated?.Invoke(this, evt);
        });

        _hubConnection.On<QuestionEndedEvent>("QuestionEnded", evt =>
        {
            QuestionEnded?.Invoke(this, evt);
        });

        _hubConnection.On<GameEndedEvent>("GameEnded", evt =>
        {
            GameEnded?.Invoke(this, evt);
        });

        _hubConnection.On<string>("Error", message =>
        {
            Error?.Invoke(this, message);
        });

        await _hubConnection.StartAsync();
    }

    public async Task DisconnectAsync()
    {
        if (_hubConnection != null)
        {
            await _hubConnection.StopAsync();
            await _hubConnection.DisposeAsync();
            _hubConnection = null;
        }
    }

    public async Task JoinRoomAsync(string roomCode)
    {
        if (_hubConnection?.State == HubConnectionState.Connected)
        {
            await _hubConnection.InvokeAsync("JoinRoom", roomCode);
        }
    }

    public async Task LeaveRoomAsync(string roomCode)
    {
        if (_hubConnection?.State == HubConnectionState.Connected)
        {
            await _hubConnection.InvokeAsync("LeaveRoom", roomCode);
        }
    }

    public async Task StartGameAsync(string roomCode)
    {
        if (_hubConnection?.State == HubConnectionState.Connected)
        {
            await _hubConnection.InvokeAsync("StartGame", roomCode);
        }
    }

    public async Task SubmitAnswerAsync(string roomCode, Guid questionId, Guid optionId)
    {
        if (_hubConnection?.State == HubConnectionState.Connected)
        {
            await _hubConnection.InvokeAsync("SubmitAnswer", roomCode, questionId, optionId);
        }
    }
}
