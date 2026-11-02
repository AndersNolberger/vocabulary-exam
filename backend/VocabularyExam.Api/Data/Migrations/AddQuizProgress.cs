using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace VocabularyExam.Api.Data.Migrations;

[DbContext(typeof(ProgressDbContext))]
[Migration("20261102220000_AddQuizProgress")]
public class AddQuizProgress : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "QuizRounds",
            columns: table => new
            {
                Id = table.Column<string>(maxLength: 32, nullable: false),
                UserId = table.Column<string>(maxLength: 450, nullable: false),
                WordSetId = table.Column<int>(nullable: false),
                Typed = table.Column<bool>(nullable: false),
                StartedAt = table.Column<DateTime>(nullable: false),
                CompletedAt = table.Column<DateTime>(nullable: true),
                Xp = table.Column<int>(nullable: false),
                QuestionsJson = table.Column<string>(nullable: false),
                CompletionJson = table.Column<string>(nullable: true),
                Version = table.Column<string>(maxLength: 32, nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_QuizRounds", x => x.Id));
        migrationBuilder.CreateIndex(
            name: "IX_QuizRounds_UserId_CompletedAt",
            table: "QuizRounds",
            columns: new[] { "UserId", "CompletedAt" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
        => migrationBuilder.DropTable("QuizRounds");

    protected override void BuildTargetModel(ModelBuilder modelBuilder)
        => ProgressDbContextModelSnapshot.ConfigureModel(modelBuilder);
}
