using System.Security.Cryptography;
using System.Text;
using Sabq.Application.Interfaces;
using Sabq.Shared.DTOs;

namespace Sabq.Api.Services;

public class AdminAuthService
{
    private const int DefaultTokenLifetimeMinutes = 60;
    private readonly IConfiguration _configuration;
    private readonly ITokenService _tokenService;
    private readonly ILogger<AdminAuthService> _logger;

    public AdminAuthService(
        IConfiguration configuration,
        ITokenService tokenService,
        ILogger<AdminAuthService> logger)
    {
        _configuration = configuration;
        _tokenService = tokenService;
        _logger = logger;
    }

    public AdminLoginResponse? Login(AdminLoginRequest request)
    {
        var configuredUsername = _configuration["Admin:Username"];
        var configuredPassword = _configuration["Admin:Password"];

        if (string.IsNullOrWhiteSpace(configuredUsername) || string.IsNullOrWhiteSpace(configuredPassword))
        {
            _logger.LogWarning("Admin login attempted while Admin credentials are not configured.");
            return null;
        }

        var username = request.Username.Trim();
        if (!SecureEquals(configuredUsername.Trim(), username) ||
            !SecureEquals(configuredPassword, request.Password))
        {
            return null;
        }

        var expiresAtUtc = DateTime.UtcNow.AddMinutes(GetTokenLifetimeMinutes());
        var token = _tokenService.GenerateAdminToken(configuredUsername.Trim(), expiresAtUtc);

        return new AdminLoginResponse(token, configuredUsername.Trim(), expiresAtUtc);
    }

    private int GetTokenLifetimeMinutes()
    {
        var configuredValue = _configuration["Admin:TokenLifetimeMinutes"];
        if (!int.TryParse(configuredValue, out var minutes) || minutes <= 0)
        {
            return DefaultTokenLifetimeMinutes;
        }

        return Math.Min(minutes, 24 * 60);
    }

    private static bool SecureEquals(string expected, string provided)
    {
        var expectedBytes = Encoding.UTF8.GetBytes(expected);
        var providedBytes = Encoding.UTF8.GetBytes(provided);

        return expectedBytes.Length == providedBytes.Length &&
            CryptographicOperations.FixedTimeEquals(expectedBytes, providedBytes);
    }
}
