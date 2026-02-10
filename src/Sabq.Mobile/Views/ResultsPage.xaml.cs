using Sabq.Mobile.ViewModels;

namespace Sabq.Mobile.Views;

public partial class ResultsPage : ContentPage
{
    private readonly ResultsViewModel _viewModel;

    public ResultsPage(ResultsViewModel viewModel)
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
