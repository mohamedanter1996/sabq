using CommunityToolkit.Mvvm.ComponentModel;
using Sabq.Mobile.Services;
using Sabq.Mobile.Views;

namespace Sabq.Mobile.ViewModels;

public partial class SplashViewModel : ObservableObject
{
    private readonly PreferencesService _preferences;

    public SplashViewModel(PreferencesService preferences)
    {
        _preferences = preferences;
    }

    public async Task InitializeAsync()
    {
        await Task.Delay(2000); // Show splash for 2 seconds

        if (_preferences.IsLoggedIn)
        {
            await Shell.Current.GoToAsync($"//{nameof(HomePage)}");
        }
        else
        {
            await Shell.Current.GoToAsync($"//{nameof(LoginPage)}");
        }
    }
}
