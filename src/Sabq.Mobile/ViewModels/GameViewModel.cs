using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Sabq.Mobile.Services;
using Sabq.Mobile.Views;
using Sabq.Shared.DTOs;
using Sabq.Shared.SignalR;
using System.Collections.ObjectModel;

namespace Sabq.Mobile.ViewModels;

public partial class GameViewModel : ObservableObject, IQueryAttributable
{
    private readonly SignalRService _signalR;
    private readonly PreferencesService _preferences;
    private string _roomCode = string.Empty;
    private Guid _currentQuestionId;

    [ObservableProperty]
    private QuestionDto? _currentQuestion;

    [ObservableProperty]
    private int _questionNumber;

    [ObservableProperty]
    private int _totalQuestions;

    [ObservableProperty]
    private int _timeRemaining;

    [ObservableProperty]
    private bool _hasAnswered;

    [ObservableProperty]
    private Guid? _selectedOptionId;

    [ObservableProperty]
    private bool _showCorrectAnswer;

    [ObservableProperty]
    private Guid? _correctOptionId;

    [ObservableProperty]
    private ObservableCollection<PlayerDto> _leaderboard = new();

    [ObservableProperty]
    private int _myScore;

    public GameViewModel(SignalRService signalR, PreferencesService preferences)
    {
        _signalR = signalR;
        _preferences = preferences;
    }

    public void ApplyQueryAttributes(IDictionary<string, object> query)
    {
        if (query.ContainsKey("roomCode"))
        {
            _roomCode = query["roomCode"].ToString() ?? "";
        }
    }

    public void Initialize()
    {
        _signalR.NewQuestion += OnNewQuestion;
        _signalR.AnswerResult += OnAnswerResult;
        _signalR.ScoresUpdated += OnScoresUpdated;
        _signalR.QuestionEnded += OnQuestionEnded;
        _signalR.GameEnded += OnGameEnded;
    }

    public void Cleanup()
    {
        _signalR.NewQuestion -= OnNewQuestion;
        _signalR.AnswerResult -= OnAnswerResult;
        _signalR.ScoresUpdated -= OnScoresUpdated;
        _signalR.QuestionEnded -= OnQuestionEnded;
        _signalR.GameEnded -= OnGameEnded;
    }

    private void OnNewQuestion(object? sender, NewQuestionEvent evt)
    {
        MainThread.BeginInvokeOnMainThread(() =>
        {
            CurrentQuestion = evt.Question;
            _currentQuestionId = evt.Question.Id;
            QuestionNumber = evt.QuestionNumber;
            TotalQuestions = evt.TotalQuestions;
            TimeRemaining = evt.Question.TimeLimitSec;
            HasAnswered = false;
            SelectedOptionId = null;
            ShowCorrectAnswer = false;
            CorrectOptionId = null;

            StartTimer();
        });
    }

    private void OnAnswerResult(object? sender, AnswerResultEvent evt)
    {
        if (evt.PlayerId == _preferences.PlayerId)
        {
            MainThread.BeginInvokeOnMainThread(() =>
            {
                MyScore = evt.UpdatedScore;
            });
        }
    }

    private void OnScoresUpdated(object? sender, ScoresUpdatedEvent evt)
    {
        MainThread.BeginInvokeOnMainThread(() =>
        {
            Leaderboard = new ObservableCollection<PlayerDto>(evt.Leaderboard);
            var me = evt.Leaderboard.FirstOrDefault(p => p.Id == _preferences.PlayerId);
            if (me != null)
            {
                MyScore = me.Score;
            }
        });
    }

    private void OnQuestionEnded(object? sender, QuestionEndedEvent evt)
    {
        MainThread.BeginInvokeOnMainThread(() =>
        {
            CorrectOptionId = evt.CorrectOptionId;
            ShowCorrectAnswer = true;
            Leaderboard = new ObservableCollection<PlayerDto>(evt.Leaderboard);
        });
    }

    private void OnGameEnded(object? sender, GameEndedEvent evt)
    {
        MainThread.BeginInvokeOnMainThread(async () =>
        {
            await Shell.Current.GoToAsync($"../{nameof(ResultsPage)}?roomCode={_roomCode}");
        });
    }

    [RelayCommand]
    private async Task SubmitAnswerAsync(Guid optionId)
    {
        if (HasAnswered) return;

        HasAnswered = true;
        SelectedOptionId = optionId;

        await _signalR.SubmitAnswerAsync(_roomCode, _currentQuestionId, optionId);
    }

    private void StartTimer()
    {
        Task.Run(async () =>
        {
            while (TimeRemaining > 0 && !ShowCorrectAnswer)
            {
                await Task.Delay(1000);
                MainThread.BeginInvokeOnMainThread(() =>
                {
                    TimeRemaining--;
                });
            }
        });
    }
}
