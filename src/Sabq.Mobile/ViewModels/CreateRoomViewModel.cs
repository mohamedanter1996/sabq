using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Sabq.Domain.Enums;
using Sabq.Mobile.Services;
using Sabq.Mobile.Views;
using Sabq.Shared.DTOs;
using System.Collections.ObjectModel;

namespace Sabq.Mobile.ViewModels;

public partial class CreateRoomViewModel : ObservableObject
{
    private readonly ApiService _apiService;

    [ObservableProperty]
    private ObservableCollection<CategoryDto> _categories = new();

    [ObservableProperty]
    private ObservableCollection<CategoryDto> _selectedCategories = new();

    [ObservableProperty]
    private bool _easySelected = true;

    [ObservableProperty]
    private bool _mediumSelected = true;

    [ObservableProperty]
    private bool _hardSelected = true;

    [ObservableProperty]
    private int _questionCount = 10;

    [ObservableProperty]
    private bool _isBusy;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    public CreateRoomViewModel(ApiService apiService)
    {
        _apiService = apiService;
    }

    public async Task LoadCategoriesAsync()
    {
        IsBusy = true;
        try
        {
            var categories = await _apiService.GetCategoriesAsync();
            if (categories != null)
            {
                Categories = new ObservableCollection<CategoryDto>(categories);
                if (Categories.Count > 0)
                {
                    SelectedCategories.Add(Categories[0]);
                }
            }
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task CreateAsync()
    {
        if (SelectedCategories.Count == 0)
        {
            ErrorMessage = "الرجاء اختيار فئة واحدة على الأقل";
            return;
        }

        var difficulties = new List<Difficulty>();
        if (EasySelected) difficulties.Add(Difficulty.Easy);
        if (MediumSelected) difficulties.Add(Difficulty.Medium);
        if (HardSelected) difficulties.Add(Difficulty.Hard);

        if (difficulties.Count == 0)
        {
            ErrorMessage = "الرجاء اختيار مستوى صعوبة واحد على الأقل";
            return;
        }

        IsBusy = true;
        ErrorMessage = string.Empty;

        try
        {
            var request = new CreateRoomRequest
            {
                CategoryIds = SelectedCategories.Select(c => c.Id).ToList(),
                Difficulties = difficulties,
                QuestionCount = QuestionCount,
                TimeLimitSec = 15
            };

            var response = await _apiService.CreateRoomAsync(request);
            if (response != null)
            {
                await Shell.Current.GoToAsync($"../{nameof(LobbyPage)}?roomCode={response.RoomCode}");
            }
            else
            {
                ErrorMessage = "فشل إنشاء الغرفة";
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
