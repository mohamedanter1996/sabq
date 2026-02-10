using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Sabq.Domain.Enums;
using Sabq.Mobile.Services;
using Sabq.Mobile.Views;
using Sabq.Shared.DTOs;
using Sabq.Shared.SignalR;
using System.Collections.ObjectModel;

namespace Sabq.Mobile.ViewModels;

public partial class LobbyViewModel : ObservableObject, IQueryAttributable
{
    private readonly SignalRService _signalR;
    private readonly PreferencesService _preferences;
    private string _roomCode = string.Empty;

    [ObservableProperty]
    private string _displayRoomCode = string.Empty;

    [ObservableProperty]
    private ObservableCollection<PlayerDto> _players = new();

    [ObservableProperty]
    private bool _isHost;

    [ObservableProperty]
    private bool _isBusy;

    [ObservableProperty]
    private RoomStatus _roomStatus = RoomStatus.Lobby;

    public LobbyViewModel(SignalRService signalR, PreferencesService preferences)
    {
        _signalR = signalR;
        _preferences = preferences;
    }

    public void ApplyQueryAttributes(IDictionary<string, object> query)
    {
        if (query.ContainsKey("roomCode"))
        {
            _roomCode = query["roomCode"].ToString() ?? "";
            DisplayRoomCode = _roomCode;
        }
    }

    public async Task InitializeAsync()
    {
        _signalR.RoomSnapshotReceived += OnRoomSnapshot;
        _signalR.PlayerJoined += OnPlayerJoined;
        _signalR.GameStarted += OnGameStarted;

        await _signalR.ConnectAsync();
        await _signalR.JoinRoomAsync(_roomCode);
    }

    public async Task CleanupAsync()
    {
        _signalR.RoomSnapshotReceived -= OnRoomSnapshot;
        _signalR.PlayerJoined -= OnPlayerJoined;
        _signalR.GameStarted -= OnGameStarted;

        await _signalR.LeaveRoomAsync(_roomCode);
    }

    private void OnRoomSnapshot(object? sender, RoomSnapshot snapshot)
    {
        MainThread.BeginInvokeOnMainThread(() =>
        {
            Players = new ObservableCollection<PlayerDto>(snapshot.Players);
            IsHost = snapshot.HostPlayerId == _preferences.PlayerId;
            RoomStatus = snapshot.Status;

            if (RoomStatus == RoomStatus.Running)
            {
                NavigateToGame();
            }
        });
    }

    private void OnPlayerJoined(object? sender, PlayerJoinedEvent evt)
    {
        MainThread.BeginInvokeOnMainThread(() =>
        {
            Players.Add(evt.Player);
        });
    }

    private void OnGameStarted(object? sender, GameStartedEvent evt)
    {
        MainThread.BeginInvokeOnMainThread(() =>
        {
            NavigateToGame();
        });
    }

    [RelayCommand]
    private async Task StartGameAsync()
    {
        if (!IsHost) return;

        IsBusy = true;
        try
        {
            await _signalR.StartGameAsync(_roomCode);
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task CopyRoomCodeAsync()
    {
        await Clipboard.SetTextAsync(_roomCode);
        await Shell.Current.DisplayAlert("تم", "تم نسخ رمز الغرفة", "حسناً");
    }

    private async void NavigateToGame()
    {
        await Shell.Current.GoToAsync($"../{nameof(GamePage)}?roomCode={_roomCode}");
    }
}
