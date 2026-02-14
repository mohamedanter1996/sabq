using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Sabq.Application.Services;
using Sabq.Infrastructure.Data;
using System.Data;

namespace Sabq.Api.BackgroundServices;

/// <summary>
/// Background service that runs the archive job daily at 02:00 Africa/Cairo time.
/// Uses SQL Server sp_getapplock to prevent concurrent execution across instances.
/// </summary>
public class ArchiveJobScheduler : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ArchiveJobScheduler> _logger;
    private readonly TimeZoneInfo _cairoTimeZone;

    private const string LockResource = "ArchiveJobLock";
    private const int LockTimeoutMs = 0; // Don't wait, skip if locked

    public ArchiveJobScheduler(IServiceProvider serviceProvider, ILogger<ArchiveJobScheduler> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;

        // Try to get Cairo timezone, fall back to UTC+2 if not found
        try
        {
            _cairoTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time") // Windows
                ?? TimeZoneInfo.FindSystemTimeZoneById("Africa/Cairo"); // Linux
        }
        catch
        {
            // Fallback: UTC+2 (Cairo standard time)
            _cairoTimeZone = TimeZoneInfo.CreateCustomTimeZone(
                "Cairo",
                TimeSpan.FromHours(2),
                "Cairo Standard Time",
                "Cairo Standard Time");
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Archive job scheduler started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var delay = CalculateDelayUntilNextRun();
                _logger.LogInformation(
                    "Next archive job scheduled at {NextRunUtc} UTC (delay: {DelayMinutes} minutes)",
                    DateTime.UtcNow.Add(delay),
                    delay.TotalMinutes);

                await Task.Delay(delay, stoppingToken);

                if (!stoppingToken.IsCancellationRequested)
                {
                    await RunArchiveJobWithLockAsync(stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Expected during shutdown
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in archive job scheduler loop");
                // Wait a bit before retrying
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }

        _logger.LogInformation("Archive job scheduler stopped");
    }

    /// <summary>
    /// Calculates delay until next 02:00 Cairo time.
    /// </summary>
    private TimeSpan CalculateDelayUntilNextRun()
    {
        var utcNow = DateTime.UtcNow;
        var cairoNow = TimeZoneInfo.ConvertTimeFromUtc(utcNow, _cairoTimeZone);

        // Target: 02:00 Cairo time
        var targetCairo = cairoNow.Date.AddHours(2);

        // If we've passed 02:00 today, schedule for tomorrow
        if (cairoNow >= targetCairo)
        {
            targetCairo = targetCairo.AddDays(1);
        }

        // Convert back to UTC
        var targetUtc = TimeZoneInfo.ConvertTimeToUtc(targetCairo, _cairoTimeZone);

        return targetUtc - utcNow;
    }

    /// <summary>
    /// Runs the archive job with distributed locking to prevent concurrent execution.
    /// </summary>
    private async Task RunArchiveJobWithLockAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SabqDbContext>();
        var archiveService = scope.ServiceProvider.GetRequiredService<ArchiveService>();

        var connection = context.Database.GetDbConnection();
        await connection.OpenAsync(stoppingToken);

        await using var transaction = await connection.BeginTransactionAsync(stoppingToken);

        try
        {
            // Try to acquire distributed lock
            var lockAcquired = await TryAcquireLockAsync(connection, stoppingToken);

            if (!lockAcquired)
            {
                _logger.LogInformation("Archive job skipped - another instance is running");
                return;
            }

            _logger.LogInformation("Archive job starting (lock acquired)");

            // Run the archive job
            var result = await archiveService.ArchiveOldGamesAsync(
                ArchiveService.DefaultRetentionDays,
                ArchiveService.DefaultBatchSize,
                stoppingToken);

            _logger.LogInformation(
                "Archive job completed: Archived {ArchivedCount} answers from {RoomCount} rooms in {DurationMs}ms",
                result.ArchivedAnswersCount,
                result.AffectedRoomsCount,
                result.DurationMs);

            // Release lock (happens automatically on transaction commit/rollback)
            await transaction.CommitAsync(stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Archive job failed");
            await transaction.RollbackAsync(stoppingToken);
            throw;
        }
    }

    /// <summary>
    /// Attempts to acquire a distributed lock using SQL Server sp_getapplock.
    /// </summary>
    private async Task<bool> TryAcquireLockAsync(
        System.Data.Common.DbConnection connection,
        CancellationToken cancellationToken)
    {
        using var command = connection.CreateCommand();
        command.CommandText = @"
            DECLARE @result INT;
            EXEC @result = sp_getapplock 
                @Resource = @LockResource,
                @LockMode = 'Exclusive',
                @LockOwner = 'Transaction',
                @LockTimeout = @LockTimeout;
            SELECT @result;";

        var resourceParam = new SqlParameter("@LockResource", SqlDbType.NVarChar, 255) { Value = LockResource };
        var timeoutParam = new SqlParameter("@LockTimeout", SqlDbType.Int) { Value = LockTimeoutMs };

        command.Parameters.Add(resourceParam);
        command.Parameters.Add(timeoutParam);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        var lockResult = Convert.ToInt32(result);

        // sp_getapplock returns:
        // >= 0: Lock granted (0 = granted synchronously, 1 = granted after waiting)
        // -1: Timeout
        // -2: Canceled
        // -3: Deadlock victim
        // -999: Parameter validation error

        return lockResult >= 0;
    }
}
