using Sabq.Mobile.ViewModels;

namespace Sabq.Mobile.Views;

public partial class LobbyPage : ContentPage
{
    private readonly LobbyViewModel _viewModel;

    public LobbyPage(LobbyViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = _viewModel = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _viewModel.InitializeAsync();
    }

    protected override async void OnDisappearing()
    {
        base.OnDisappearing();
        await _viewModel.CleanupAsync();
    }
}
