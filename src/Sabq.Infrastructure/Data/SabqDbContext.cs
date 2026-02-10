using Microsoft.EntityFrameworkCore;
using Sabq.Domain.Entities;

namespace Sabq.Infrastructure.Data;

public class SabqDbContext : DbContext
{
    public SabqDbContext(DbContextOptions<SabqDbContext> options) : base(options) { }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<Option> Options => Set<Option>();
    public DbSet<Player> Players => Set<Player>();
    public DbSet<GameRoom> GameRooms => Set<GameRoom>();
    public DbSet<GameRoomPlayer> GameRoomPlayers => Set<GameRoomPlayer>();
    public DbSet<GameRoomQuestion> GameRoomQuestions => Set<GameRoomQuestion>();
    public DbSet<GameAnswer> GameAnswers => Set<GameAnswer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Category
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.NameAr).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => e.IsActive);
        });

        // Question
        modelBuilder.Entity<Question>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TextAr).IsRequired().HasMaxLength(1000);
            entity.HasIndex(e => new { e.CategoryId, e.IsActive });
            entity.HasOne(e => e.Category)
                .WithMany(c => c.Questions)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Option
        modelBuilder.Entity<Option>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TextAr).IsRequired().HasMaxLength(500);
            entity.HasOne(e => e.Question)
                .WithMany(q => q.Options)
                .HasForeignKey(e => e.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Player
        modelBuilder.Entity<Player>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.CreatedAt);
        });

        // GameRoom
        modelBuilder.Entity<GameRoom>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(10);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.Status);
        });

        // GameRoomPlayer (composite key)
        modelBuilder.Entity<GameRoomPlayer>(entity =>
        {
            entity.HasKey(e => new { e.RoomId, e.PlayerId });
            entity.HasOne(e => e.Room)
                .WithMany(r => r.Players)
                .HasForeignKey(e => e.RoomId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Player)
                .WithMany()
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // GameRoomQuestion (composite key)
        modelBuilder.Entity<GameRoomQuestion>(entity =>
        {
            entity.HasKey(e => new { e.RoomId, e.QuestionId });
            entity.HasOne(e => e.Room)
                .WithMany(r => r.Questions)
                .HasForeignKey(e => e.RoomId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Question)
                .WithMany()
                .HasForeignKey(e => e.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // GameAnswer
        modelBuilder.Entity<GameAnswer>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.RoomId, e.QuestionId, e.PlayerId });
            entity.HasOne(e => e.Room)
                .WithMany()
                .HasForeignKey(e => e.RoomId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Question)
                .WithMany()
                .HasForeignKey(e => e.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Player)
                .WithMany()
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Option)
                .WithMany()
                .HasForeignKey(e => e.OptionId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
