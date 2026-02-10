using Sabq.Mobile.ViewModels;

namespace Sabq.Mobile.Views;

public partial class SplashPage : ContentPage
{
    private readonly SplashViewModel _viewModel;

    public SplashPage(SplashViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = _viewModel = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _viewModel.InitializeAsync();
    }
}
