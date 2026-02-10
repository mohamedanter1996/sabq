using Sabq.Mobile.ViewModels;

namespace Sabq.Mobile.Views;

public partial class HomePage : ContentPage
{
    public HomePage(HomeViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
