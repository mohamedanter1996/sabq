using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Sabq.Application.Services;
using Sabq.Infrastructure.Data;
using System.Data;

namespace Sabq.Api.BackgroundServices;

public sealed class RoomLifecycleOptions
{
    public int LobbyTimeoutMinutes { get; set; } = 60;
    public int RunningStaleMinutes { get; set; } = 30;
    public int CleanupIntervalMinutes { get; set; } = 5;
}

public sealed class RoomLifecycleCleanupScheduler : BackgroundService
{
    private const string LockResource = "RoomLifecycleCleanupLock";
    private const int LockTimeoutMs = 0;

    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<RoomLifecycleCleanupScheduler> _logger;
    private readonly IOptionsMonitor<RoomLifecycleOptions> _options;

    public RoomLifecycleCleanupScheduler(
        IServiceProvider serviceProvider,
        ILogger<RoomLifecycleCleanupScheduler> logger,
        IOptionsMonitor<RoomLifecycleOptions> options)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _options = options;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Room lifecycle cleanup scheduler started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunCleanupWithLockAsync(stoppingToken);
                await Task.Delay(GetCleanupInterval(), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in room lifecycle cleanup scheduler");
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        _logger.LogInformation("Room lifecycle cleanup scheduler stopped");
    }

    private async Task RunCleanupWithLockAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SabqDbContext>();
        var lifecycleService = scope.ServiceProvider.GetRequiredService<RoomLifecycleService>();

        var connection = context.Database.GetDbConnection();
        var openedHere = connection.State != ConnectionState.Open;

        if (openedHere)
            await connection.OpenAsync(stoppingToken);

        try
        {
            if (!await TryAcquireLockAsync(connection, stoppingToken))
            {
                _logger.LogDebug("Room lifecycle cleanup skipped - another instance is running");
                return;
            }

            try
            {
                var options = _options.CurrentValue;
                var result = await lifecycleService.CleanupStaleRoomsAsync(
                    TimeSpan.FromMinutes(Math.Max(1, options.LobbyTimeoutMinutes)),
                    TimeSpan.FromMinutes(Math.Max(1, options.RunningStaleMinutes)),
                    stoppingToken);

                _logger.LogInformation(
                    "Room lifecycle cleanup checked {CheckedRooms} rooms, abandoned {LobbyRooms} lobby and {RunningRooms} running rooms",
                    result.CheckedRooms,
                    result.AbandonedLobbyRooms,
                    result.AbandonedRunningRooms);
            }
            finally
            {
                await ReleaseLockAsync(connection, stoppingToken);
            }
        }
        finally
        {
            if (openedHere)
                await connection.CloseAsync();
        }
    }

    private TimeSpan GetCleanupInterval()
    {
        return TimeSpan.FromMinutes(Math.Max(1, _options.CurrentValue.CleanupIntervalMinutes));
    }

    private static async Task<bool> TryAcquireLockAsync(
        System.Data.Common.DbConnection connection,
        CancellationToken cancellationToken)
    {
        using var command = connection.CreateCommand();
        command.CommandText = @"
            DECLARE @result INT;
            EXEC @result = sp_getapplock
                @Resource = @LockResource,
                @LockMode = 'Exclusive',
                @LockOwner = 'Session',
                @LockTimeout = @LockTimeout;
            SELECT @result;";

        command.Parameters.Add(new SqlParameter("@LockResource", SqlDbType.NVarChar, 255) { Value = LockResource });
        command.Parameters.Add(new SqlParameter("@LockTimeout", SqlDbType.Int) { Value = LockTimeoutMs });

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt32(result) >= 0;
    }

    private static async Task ReleaseLockAsync(
        System.Data.Common.DbConnection connection,
        CancellationToken cancellationToken)
    {
        using var command = connection.CreateCommand();
        command.CommandText = @"
            EXEC sp_releaseapplock
                @Resource = @LockResource,
                @LockOwner = 'Session';";

        command.Parameters.Add(new SqlParameter("@LockResource", SqlDbType.NVarChar, 255) { Value = LockResource });
        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
