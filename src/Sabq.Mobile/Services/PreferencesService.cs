namespace Sabq.Mobile.Services;

public class PreferencesService
{
    private const string KEY_TOKEN = "auth_token";
    private const string KEY_PLAYER_ID = "player_id";
    private const string KEY_DISPLAY_NAME = "display_name";

    public string? Token
    {
        get => Preferences.Get(KEY_TOKEN, null);
        set => Preferences.Set(KEY_TOKEN, value);
    }

    public Guid? PlayerId
    {
        get
        {
            var str = Preferences.Get(KEY_PLAYER_ID, null);
            return Guid.TryParse(str, out var id) ? id : null;
        }
        set => Preferences.Set(KEY_PLAYER_ID, value?.ToString());
    }

    public string? DisplayName
    {
        get => Preferences.Get(KEY_DISPLAY_NAME, null);
        set => Preferences.Set(KEY_DISPLAY_NAME, value);
    }

    public bool IsLoggedIn => !string.IsNullOrEmpty(Token) && PlayerId.HasValue;

    public void Clear()
    {
        Preferences.Remove(KEY_TOKEN);
        Preferences.Remove(KEY_PLAYER_ID);
        Preferences.Remove(KEY_DISPLAY_NAME);
    }
}
