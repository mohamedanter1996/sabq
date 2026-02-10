using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Sabq.Mobile.Services;
using Sabq.Mobile.Views;
using Sabq.Shared.DTOs;
using Sabq.Shared.SignalR;
using System.Collections.ObjectModel;

namespace Sabq.Mobile.ViewModels;

public partial class ResultsViewModel : ObservableObject, IQueryAttributable
{
    private readonly SignalRService _signalR;
    private string _roomCode = string.Empty;

    [ObservableProperty]
    private ObservableCollection<PlayerDto> _finalLeaderboard = new();

    public ResultsViewModel(SignalRService signalR)
    {
        _signalR = signalR;
    }

    public void ApplyQueryAttributes(IDictionary<string, object> query)
    {
        if (query.ContainsKey("roomCode"))
        {
            _roomCode = query["roomCode"].ToString() ?? "";
        }
    }

    public void Initialize()
    {
        _signalR.GameEnded += OnGameEnded;
    }

    public void Cleanup()
    {
        _signalR.GameEnded -= OnGameEnded;
    }

    private void OnGameEnded(object? sender, GameEndedEvent evt)
    {
        MainThread.BeginInvokeOnMainThread(() =>
        {
            FinalLeaderboard = new ObservableCollection<PlayerDto>(evt.FinalLeaderboard);
        });
    }

    [RelayCommand]
    private async Task BackToHomeAsync()
    {
        await _signalR.LeaveRoomAsync(_roomCode);
        await _signalR.DisconnectAsync();
        await Shell.Current.GoToAsync($"///{nameof(HomePage)}");
    }
}
