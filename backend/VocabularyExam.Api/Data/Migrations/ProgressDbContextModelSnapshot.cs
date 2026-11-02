using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace VocabularyExam.Api.Data.Migrations;

[DbContext(typeof(ProgressDbContext))]
public class ProgressDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder) => ConfigureModel(modelBuilder);

    internal static void ConfigureModel(ModelBuilder modelBuilder)
    {
        modelBuilder.HasAnnotation("ProductVersion", "10.0.0");
        modelBuilder.Entity("VocabularyExam.Api.Models.QuizRound", b =>
        {
            b.Property<string>("Id").HasMaxLength(32);
            b.Property<string>("UserId").IsRequired().HasMaxLength(450);
            b.Property<int>("WordSetId");
            b.Property<bool>("Typed");
            b.Property<DateTime>("StartedAt");
            b.Property<DateTime?>("CompletedAt");
            b.Property<int>("Xp");
            b.Property<string>("QuestionsJson").IsRequired();
            b.Property<string>("CompletionJson");
            b.Property<string>("Version").IsRequired().HasMaxLength(32).IsConcurrencyToken();
            b.HasKey("Id");
            b.HasIndex("UserId", "CompletedAt");
            b.ToTable("QuizRounds");
        });
    }
}
