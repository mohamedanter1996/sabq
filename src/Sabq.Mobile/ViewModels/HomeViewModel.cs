using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Sabq.Mobile.Services;
using Sabq.Mobile.Views;

namespace Sabq.Mobile.ViewModels;

public partial class HomeViewModel : ObservableObject
{
    private readonly PreferencesService _preferences;
    private readonly ApiService _apiService;

    [ObservableProperty]
    private string _displayName = string.Empty;

    [ObservableProperty]
    private string _roomCode = string.Empty;

    [ObservableProperty]
    private bool _isBusy;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    public HomeViewModel(PreferencesService preferences, ApiService apiService)
    {
        _preferences = preferences;
        _apiService = apiService;
        DisplayName = preferences.DisplayName ?? "";
    }

    [RelayCommand]
    private async Task CreateRoomAsync()
    {
        await Shell.Current.GoToAsync(nameof(CreateRoomPage));
    }

    [RelayCommand]
    private async Task JoinRoomAsync()
    {
        if (string.IsNullOrWhiteSpace(RoomCode))
        {
            ErrorMessage = "الرجاء إدخال رمز الغرفة";
            return;
        }

        IsBusy = true;
        ErrorMessage = string.Empty;

        try
        {
            var response = await _apiService.JoinRoomAsync(RoomCode.ToUpper().Trim());
            if (response != null)
            {
                await Shell.Current.GoToAsync($"{nameof(LobbyPage)}?roomCode={RoomCode.ToUpper().Trim()}");
            }
            else
            {
                ErrorMessage = "الغرفة غير موجودة أو ممتلئة";
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = "حدث خطأ: " + ex.Message;
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task LogoutAsync()
    {
        _preferences.Clear();
        await Shell.Current.GoToAsync($"//{nameof(LoginPage)}");
    }
}
