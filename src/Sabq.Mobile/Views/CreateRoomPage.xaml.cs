using Sabq.Mobile.ViewModels;

namespace Sabq.Mobile.Views;

public partial class CreateRoomPage : ContentPage
{
    private readonly CreateRoomViewModel _viewModel;

    public CreateRoomPage(CreateRoomViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = _viewModel = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _viewModel.LoadCategoriesAsync();
    }
}
