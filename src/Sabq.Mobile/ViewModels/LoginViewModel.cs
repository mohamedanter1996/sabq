using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Sabq.Mobile.Services;
using Sabq.Mobile.Views;

namespace Sabq.Mobile.ViewModels;

public partial class LoginViewModel : ObservableObject
{
    private readonly ApiService _apiService;
    private readonly PreferencesService _preferences;

    [ObservableProperty]
    private string _displayName = string.Empty;

    [ObservableProperty]
    private bool _isBusy;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    public LoginViewModel(ApiService apiService, PreferencesService preferences)
    {
        _apiService = apiService;
        _preferences = preferences;
    }

    [RelayCommand]
    private async Task LoginAsync()
    {
        if (string.IsNullOrWhiteSpace(DisplayName))
        {
            ErrorMessage = "الرجاء إدخال اسم العرض";
            return;
        }

        if (DisplayName.Length > 50)
        {
            ErrorMessage = "الاسم طويل جداً";
            return;
        }

        IsBusy = true;
        ErrorMessage = string.Empty;

        try
        {
            var response = await _apiService.GuestLoginAsync(DisplayName.Trim());
            if (response != null)
            {
                _preferences.PlayerId = response.PlayerId;
                _preferences.DisplayName = response.DisplayName;
                _preferences.Token = response.Token;

                await Shell.Current.GoToAsync($"//{nameof(HomePage)}");
            }
            else
            {
                ErrorMessage = "فشل تسجيل الدخول";
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
}
