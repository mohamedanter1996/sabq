using Sabq.Shared.DTOs;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace Sabq.Mobile.Services;

public class ApiService
{
    private readonly HttpClient _httpClient;
    private readonly PreferencesService _preferences;

#if ANDROID
    private const string BaseUrl = "http://10.0.2.2:5000"; // Android emulator localhost
#elif WINDOWS
    private const string BaseUrl = "http://localhost:5000"; // Windows localhost
#else
    private const string BaseUrl = "http://localhost:5000";
#endif

    public ApiService(PreferencesService preferences)
    {
        _preferences = preferences;
        _httpClient = new HttpClient
        {
            BaseAddress = new Uri(BaseUrl),
            Timeout = TimeSpan.FromSeconds(30)
        };
    }

    private void SetAuthHeader()
    {
        if (!string.IsNullOrEmpty(_preferences.Token))
        {
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _preferences.Token);
        }
    }

    public async Task<GuestLoginResponse?> GuestLoginAsync(string displayName)
    {
        try
        {
            var request = new GuestLoginRequest(displayName);
            var response = await _httpClient.PostAsJsonAsync("/api/auth/guest", request);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<GuestLoginResponse>();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Login error: {ex.Message}");
            return null;
        }
    }

    public async Task<List<CategoryDto>?> GetCategoriesAsync()
    {
        try
        {
            SetAuthHeader();
            return await _httpClient.GetFromJsonAsync<List<CategoryDto>>("/api/rooms/categories");
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Get categories error: {ex.Message}");
            return null;
        }
    }

    public async Task<CreateRoomResponse?> CreateRoomAsync(CreateRoomRequest request)
    {
        try
        {
            SetAuthHeader();
            var response = await _httpClient.PostAsJsonAsync("/api/rooms", request);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<CreateRoomResponse>();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Create room error: {ex.Message}");
            return null;
        }
    }

    public async Task<JoinRoomResponse?> JoinRoomAsync(string roomCode)
    {
        try
        {
            SetAuthHeader();
            var response = await _httpClient.PostAsync($"/api/rooms/{roomCode}/join", null);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<JoinRoomResponse>();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Join room error: {ex.Message}");
            return null;
        }
    }

    public async Task<bool> StartGameAsync(string roomCode)
    {
        try
        {
            SetAuthHeader();
            var response = await _httpClient.PostAsync($"/api/rooms/{roomCode}/start", null);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Start game error: {ex.Message}");
            return false;
        }
    }
}
