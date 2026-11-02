using Microsoft.EntityFrameworkCore;
using VocabularyExam.Api.Models;

namespace VocabularyExam.Api.Data;

// Separate migrations add progress tables without replacing the existing EnsureCreated homework schema.
public class ProgressDbContext(DbContextOptions<ProgressDbContext> options) : DbContext(options)
{
    public DbSet<QuizRound> QuizRounds => Set<QuizRound>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var round = modelBuilder.Entity<QuizRound>();
        round.ToTable("QuizRounds");
        round.HasKey(r => r.Id);
        round.Property(r => r.Id).HasMaxLength(32);
        round.Property(r => r.UserId).HasMaxLength(450);
        round.Property(r => r.Version).HasMaxLength(32).IsConcurrencyToken();
        round.HasIndex(r => new { r.UserId, r.CompletedAt });
    }
}
