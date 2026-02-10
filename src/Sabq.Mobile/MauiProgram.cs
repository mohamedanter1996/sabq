using Microsoft.Extensions.Logging;
using Sabq.Mobile.Services;
using Sabq.Mobile.ViewModels;
using Sabq.Mobile.Views;

namespace Sabq.Mobile;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("Cairo-Regular.ttf", "CairoRegular");
                fonts.AddFont("Cairo-Bold.ttf", "CairoBold");
            });

#if DEBUG
        builder.Logging.AddDebug();
#endif

        // Services
        builder.Services.AddSingleton<PreferencesService>();
        builder.Services.AddSingleton<ApiService>();
        builder.Services.AddSingleton<SignalRService>();

        // ViewModels
        builder.Services.AddTransient<SplashViewModel>();
        builder.Services.AddTransient<LoginViewModel>();
        builder.Services.AddTransient<HomeViewModel>();
        builder.Services.AddTransient<CreateRoomViewModel>();
        builder.Services.AddTransient<LobbyViewModel>();
        builder.Services.AddTransient<GameViewModel>();
        builder.Services.AddTransient<ResultsViewModel>();

        // Views
        builder.Services.AddTransient<SplashPage>();
        builder.Services.AddTransient<LoginPage>();
        builder.Services.AddTransient<HomePage>();
        builder.Services.AddTransient<CreateRoomPage>();
        builder.Services.AddTransient<LobbyPage>();
        builder.Services.AddTransient<GamePage>();
        builder.Services.AddTransient<ResultsPage>();

        return builder.Build();
    }
}
