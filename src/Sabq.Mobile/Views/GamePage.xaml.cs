using Sabq.Mobile.ViewModels;

namespace Sabq.Mobile.Views;

public partial class GamePage : ContentPage
{
    private readonly GameViewModel _viewModel;

    public GamePage(GameViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = _viewModel = viewModel;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        _viewModel.Initialize();
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        _viewModel.Cleanup();
    }
}
