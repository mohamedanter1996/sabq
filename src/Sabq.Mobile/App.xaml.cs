using Sabq.Mobile.Views;

namespace Sabq.Mobile;

public partial class App : Application
{
    public App()
    {
        InitializeComponent();

        MainPage = new NavigationPage(new SplashPage())
        {
            BarBackgroundColor = Colors.Transparent,
            BarTextColor = Colors.White
        };
    }
}
