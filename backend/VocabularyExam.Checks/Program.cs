using System.Text.Json;
using System.Diagnostics.CodeAnalysis;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using VocabularyExam.Api.Data;
using VocabularyExam.Api.Dtos;
using VocabularyExam.Api.Models;
using VocabularyExam.Api.Services;

static void Check([DoesNotReturnIf(false)] bool condition, string message)
{
    if (!condition) throw new Exception(message);
}

await using var connection = new SqliteConnection("Data Source=:memory:");
await connection.OpenAsync();
var wordOptions = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options;
var progressOptions = new DbContextOptionsBuilder<ProgressDbContext>()
    .UseSqlite(connection, sql => sql.MigrationsHistoryTable("__ProgressMigrationsHistory")).Options;
await using var words = new AppDbContext(wordOptions);
await words.Database.EnsureCreatedAsync();
var set = new WordSet
{
    Name = "Existing homework",
    UserId = "alice",
    WordPairs = new()
    {
        new() { SwedishWord = "solen", ForeignWord = "die Sonne" },
        new() { SwedishWord = "huset", ForeignWord = "das Haus" },
        new() { SwedishWord = "boken", ForeignWord = "das Buch" }
    }
};
words.WordSets.Add(set);
words.WordSets.Add(new WordSet { Name = "Other user's homework", UserId = "bob" });
await words.SaveChangesAsync();

await using var database = new ProgressDbContext(progressOptions);
await database.Database.MigrateAsync();
await database.Database.MigrateAsync();
Check(await words.WordSets.CountAsync() == 2, "Migration must preserve existing homework.");
Check(!database.Database.HasPendingModelChanges(), "SQLite progress model must match its migration.");
var service = new ProgressService(words, database, new QuizService(words));
Check((await service.GetProgressAsync("alice")).TotalXp == 0, "New user starts with zero XP.");
Check(await service.StartRoundAsync(set.Id, true, null, "bob") == null, "Cannot quiz another user's homework.");
Check(await service.StartRoundAsync(-1, false, null, "alice") == null, "Missing homework must not start a round.");

var round = (await service.StartRoundAsync(set.Id, true, null, "alice"))!;
Check(round.Questions.Count == 3 && round.Questions.All(q => q.IsTypedAnswer && q.GermanOptions.Count == 0),
    "Typed round question shape.");
Check(!JsonSerializer.Serialize(round).Contains("ExpectedAnswer"), "Never expose expected typed answers.");
Check(await service.SubmitAsync(round.RoundId, round.Questions[0].Id, "wrong", "bob") == null,
    "Cannot submit another user's round.");
Check(await service.SubmitAsync(round.RoundId, -1, "wrong", "alice") == null, "Reject questions outside the round.");
Check(await service.StartRoundAsync(set.Id, true, round.RoundId, "alice") == null, "Cannot retry incomplete round.");
var sun = round.Questions.Single(q => q.SwedishWord == "solen");
var house = round.Questions.Single(q => q.SwedishWord == "huset");
var book = round.Questions.Single(q => q.SwedishWord == "boken");
var caseAnswer = (await service.SubmitAsync(round.RoundId, sun.Id, "die sonne", "alice"))!;
Check(!caseAnswer.IsCorrect && caseAnswer.CapitalizationOnly && caseAnswer.Completion == null, "Capitalization stays incorrect.");
var duplicate = (await service.SubmitAsync(round.RoundId, sun.Id, "die Sonne", "alice"))!;
Check(!duplicate.IsCorrect, "Repeated submissions cannot change the first result.");
Check((await service.GetProgressAsync("alice")).CompletedRounds == 0, "Incomplete rounds don't affect stats.");
await service.SubmitAsync(round.RoundId, house.Id, " das Haus ", "alice");
var final = (await service.SubmitAsync(round.RoundId, book.Id, "wrong", "alice"))!;
Check(final.Completion?.EarnedXp == 30, "One correct plus finish should earn 30 XP.");
Check(final.Completion.NewAchievements.Select(a => a.Id).SequenceEqual(new[] { "first-round" }), "First-round milestone.");
var summary = await service.GetProgressAsync("alice");
Check(summary.TotalXp == 30 && summary.Level == 1 && summary.XpInLevel == 30, "XP arithmetic.");
var stats = summary.WordSets.Single();
Check(stats.CompletedRounds == 1 && stats.AccuracyPercent == 33 && stats.BestAccuracyPercent == 33 && stats.WordsToPractice == 2,
    "Per-homework statistics and missed words.");
await service.SubmitAsync(round.RoundId, book.Id, "das Buch", "alice");
Check((await service.GetProgressAsync("alice")).TotalXp == 30, "Duplicate last answer must not award XP again.");
Check(await service.StartRoundAsync(set.Id, false, round.RoundId, "alice") == null, "Retry cannot change quiz mode.");

var retry = (await service.StartRoundAsync(set.Id, true, round.RoundId, "alice"))!;
Check(retry.Questions.Select(q => q.Id).Order().SequenceEqual(new[] { sun.Id, book.Id }.Order()), "Retry only missed words.");
await service.SubmitAsync(retry.RoundId, sun.Id, "die Sonne", "alice");
var retryFinal = (await service.SubmitAsync(retry.RoundId, book.Id, "das Buch", "alice"))!;
Check(retryFinal.Completion?.EarnedXp == 40 && retryFinal.Completion.NewAchievements.Single().Id == "perfect-round",
    "Perfect retry awards XP and achievement.");
Check((await service.GetProgressAsync("alice")).WordSets.Single().WordsToPractice == 0, "Correcting words clears practice count.");
Check(await service.StartRoundAsync(set.Id, true, retry.RoundId, "alice") == null, "No retry after perfect round.");

var choice = (await service.StartRoundAsync(set.Id, false, null, "alice"))!;
Check(choice.Questions.All(q => !q.IsTypedAnswer && q.GermanOptions.Count == 3), "Multiple-choice options preserved.");
TrackedAnswerDto? choiceFinal = null;
foreach (var question in choice.Questions)
    choiceFinal = await service.SubmitAsync(choice.RoundId, question.Id,
        set.WordPairs.Single(w => w.Id == question.Id).ForeignWord, "alice");
Check(choiceFinal?.Completion?.LeveledUp == true && choiceFinal.Completion.Level == 2, "Crossing 100 XP levels up.");
Check(choiceFinal.Completion.NewAchievements.Select(a => a.Id).SequenceEqual(new[] { "first-round-2" }),
    "Third round unlocks tier two, without repeating earlier achievements.");

for (var i = 0; i < 7; i++)
{
    var milestone = (await service.StartRoundAsync(set.Id, true, null, "alice"))!;
    foreach (var question in milestone.Questions)
        final = (await service.SubmitAsync(milestone.RoundId, question.Id,
            set.WordPairs.Single(w => w.Id == question.Id).ForeignWord, "alice"))!;
}
Check(final.Completion!.NewAchievements.Any(a => a.Id == "ten-rounds"), "Ten-round milestone triggers exactly at ten.");
Check((await service.GetProgressAsync("alice")).CorrectAnswers == 27, "Correct answer totals include retries.");
for (var i = 0; i < 7; i++)
{
    var milestone = (await service.StartRoundAsync(set.Id, true, null, "alice"))!;
    foreach (var question in milestone.Questions)
        await service.SubmitAsync(milestone.RoundId, question.Id, set.WordPairs.Single(w => w.Id == question.Id).ForeignWord, "alice");
}
Check(!(await service.GetProgressAsync("alice")).Achievements.Single(a => a.Id == "fifty-correct").Unlocked,
    "48 correct must not unlock 50 milestone.");
var fortyNine = (await service.StartRoundAsync(set.Id, true, null, "alice"))!;
foreach (var question in fortyNine.Questions)
    await service.SubmitAsync(fortyNine.RoundId, question.Id, question.Id == fortyNine.Questions[0].Id
        ? set.WordPairs.Single(w => w.Id == question.Id).ForeignWord : "wrong", "alice");
var atFortyNine = await service.GetProgressAsync("alice");
Check(atFortyNine.CorrectAnswers == 49 && !atFortyNine.Achievements.Single(a => a.Id == "fifty-correct").Unlocked,
    "Exactly 49 correct must not unlock 50 milestone.");
var fifty = (await service.StartRoundAsync(set.Id, true, null, "alice"))!;
foreach (var question in fifty.Questions)
    final = (await service.SubmitAsync(fifty.RoundId, question.Id, question.Id == fifty.Questions[0].Id
        ? set.WordPairs.Single(w => w.Id == question.Id).ForeignWord : "wrong", "alice"))!;
Check(final.Completion!.NewAchievements.Single().Id == "fifty-correct", "50 correct milestone.");
var bob = await service.GetProgressAsync("bob");
Check(bob.TotalXp == 0 && bob.CompletedRounds == 0 && bob.WordSets.All(s => s.WordSetId != set.Id), "User progress isolation.");

await using (var restarted = new ProgressDbContext(progressOptions))
{
    var persisted = await new ProgressService(words, restarted, new QuizService(words)).GetProgressAsync("alice");
    Check(persisted.CorrectAnswers == 50 && persisted.Achievements.Where(a => a.Tier == 1 &&
        a.Id != "comebacks").All(a => a.Unlocked), "Progress persists across context restarts.");
}

var conflictRound = (await service.StartRoundAsync(set.Id, true, null, "alice"))!;
await using (var otherContext = new ProgressDbContext(progressOptions))
{
    var stale = await otherContext.QuizRounds.SingleAsync(r => r.Id == conflictRound.RoundId);
    await service.SubmitAsync(conflictRound.RoundId, sun.Id, "die Sonne", "alice");
    stale.Version = Guid.NewGuid().ToString("N");
    try
    {
        await otherContext.SaveChangesAsync();
        throw new Exception("Stale concurrent write was accepted.");
    }
    catch (DbUpdateConcurrencyException) { }
}

var beforeDeletion = await service.GetProgressAsync("alice");
words.WordSets.Remove(set);
await words.SaveChangesAsync();
var afterDeletion = await service.GetProgressAsync("alice");
Check(afterDeletion.TotalXp == beforeDeletion.TotalXp && afterDeletion.WordSets.Count == 0,
    "Deleting homework keeps earned XP, removes its stats.");
Check(await service.SubmitAsync(conflictRound.RoundId, book.Id, "das Buch", "alice") == null, "Deleted homework cannot earn more XP.");

foreach (var (xp, level, within, cost) in new[]
{
    (0, 1, 0, 100), (99, 1, 99, 100), (100, 2, 0, 150), (249, 2, 149, 150),
    (250, 3, 0, 225), (474, 3, 224, 225), (475, 4, 0, 338), (812, 4, 337, 338),
    (813, 5, 0, 507)
})
{
    var levelProgress = LevelProgress.FromXp(xp);
    Check(levelProgress.Level == level && levelProgress.XpInLevel == within && levelProgress.XpForNextLevel == cost,
        $"XP curve boundary failed at {xp}.");
}
Check(LevelProgress.FromXp(int.MaxValue).XpForNextLevel > 0, "Large XP must not overflow the cost.");

var difficultSet = new WordSet
{
    UserId = "practice", Name = "Difficult words",
    WordPairs = Enumerable.Range(1, 14).Select(i => new WordPair { SwedishWord = $"word {i}", ForeignWord = $"Wort{i}" }).ToList()
};
words.WordSets.Add(difficultSet);
await words.SaveChangesAsync();
var baselineTime = DateTime.UtcNow.AddDays(-1);
void SeedHistory(string user, int setId, IEnumerable<(int Id, bool Correct)> answers, int order, bool typed = true)
{
    database.QuizRounds.Add(new QuizRound
    {
        UserId = user, WordSetId = setId, Typed = typed,
        CompletedAt = baselineTime.AddSeconds(order), Xp = 20,
        QuestionsJson = JsonSerializer.Serialize(answers.Select(a => new
        {
            Question = new QuizQuestionDto { Id = a.Id, SwedishWord = $"word {a.Id}", IsTypedAnswer = typed },
            ExpectedAnswer = "test",
            Result = new QuizAnswerResultDto { IsCorrect = a.Correct }
        }))
    });
}
// First 11 words: 2/5 wrong (exactly 40%); word 12: 1/5; word 13: 0/5; word 14: untested.
for (var i = 0; i < 5; i++)
    SeedHistory("practice", difficultSet.Id, difficultSet.WordPairs.Take(13)
        .Select((w, j) => (w.Id, j < 11 ? i >= 2 : j == 11 ? i >= 1 : true)), i);
await database.SaveChangesAsync();
var practiceStats = (await service.GetProgressAsync("practice")).WordSets.Single();
Check(practiceStats.DifficultWords == 11, "Exactly 40% and two mistakes qualify; one mistake/untested words do not.");
var hardTyped = (await service.StartRoundAsync(difficultSet.Id, true, null, "practice", true))!;
Check(hardTyped.Questions.Count == 10 && hardTyped.Questions.All(q => q.IsTypedAnswer && q.GermanOptions.Count == 0),
    "Difficult typed quizzes limited to 10 words with no answers exposed.");
Check(hardTyped.Questions.Select(q => q.Id).SequenceEqual(difficultSet.WordPairs.Take(10).Select(w => w.Id)),
    "Equal difficulty uses stable word ID ordering; selection must filter before taking ten.");
var hardChoice = (await service.StartRoundAsync(difficultSet.Id, false, null, "practice", true))!;
Check(hardChoice.Questions.Count == 10 && hardChoice.Questions.All(q => q.GermanOptions.Count == 4),
    "Difficult multiple-choice keeps full-homework distractors.");
Check(await service.StartRoundAsync(difficultSet.Id, true, null, "bob", true) == null, "Difficult selection respects ownership.");
Check((await service.GetProgressAsync("bob")).WordSets.All(w => w.DifficultWords == 0), "Other users' history cannot leak.");

// Adding a correct attempt drops the first word below 40%; adding mistakes makes the last word highest priority.
SeedHistory("practice", difficultSet.Id, new[] { (difficultSet.WordPairs[0].Id, true),
    (difficultSet.WordPairs[13].Id, false) }, 6);
SeedHistory("practice", difficultSet.Id, new[] { (difficultSet.WordPairs[13].Id, false) }, 7);
await database.SaveChangesAsync();
var ranked = (await service.StartRoundAsync(difficultSet.Id, false, null, "practice", true))!;
Check(ranked.Questions[0].Id == difficultSet.WordPairs[13].Id &&
    ranked.Questions.All(q => q.Id != difficultSet.WordPairs[0].Id), "Rank high error rates first and remove words below 40%.");
var difficultRetrySource = (await service.StartRoundAsync(difficultSet.Id, true, null, "practice", true))!;
foreach (var question in difficultRetrySource.Questions)
    await service.SubmitAsync(difficultRetrySource.RoundId, question.Id, question.Id == difficultRetrySource.Questions[0].Id
        ? "wrong" : difficultSet.WordPairs.Single(w => w.Id == question.Id).ForeignWord, "practice");
var difficultRetry = (await service.StartRoundAsync(difficultSet.Id, true, difficultRetrySource.RoundId, "practice"))!;
Check(difficultRetry.Questions.Count == 1 && difficultRetry.Questions[0].Id == difficultRetrySource.Questions[0].Id,
    "Difficult quiz retries only the preceding round's failed words.");
words.WordPairs.Remove(difficultSet.WordPairs[13]);
await words.SaveChangesAsync();
var afterWordRemoval = (await service.StartRoundAsync(difficultSet.Id, true, null, "practice", true))!;
Check(afterWordRemoval.Questions.All(q => q.Id != difficultRetry.Questions[0].Id), "Deleted words excluded from difficult quizzes.");
var bobSet = await words.WordSets.SingleAsync(w => w.UserId == "bob");
Check(await service.StartRoundAsync(bobSet.Id, true, null, "bob", true) == null, "No qualifying history returns no difficult round.");

foreach (var target in new[] { 50, 150, 450 })
{
    var user = $"tier-correct-{target}";
    SeedHistory(user, 0, Enumerable.Range(1, target - 1).Select(i => (i, true)), 0);
    await database.SaveChangesAsync();
    var below = await service.GetProgressAsync(user);
    var tier = below.Achievements.Single(a => a.CategoryId == "fifty-correct" && a.Target == target);
    Check(!tier.Unlocked && tier.Current == target - 1, $"Ordmagiker tier below {target}.");
    SeedHistory(user, 0, new[] { (target, true) }, 1);
    await database.SaveChangesAsync();
    Check((await service.GetProgressAsync(user)).Achievements.Single(a => a.Id == tier.Id).Unlocked, $"Ordmagiker tier at {target}.");
}
foreach (var (category, targets) in new[]
{
    ("first-round", new[] { 1, 3, 9 }), ("perfect-round", new[] { 1, 3, 9 }),
    ("ten-rounds", new[] { 10, 30, 90 }), ("typed-correct", new[] { 25, 75, 225 }),
    ("comebacks", new[] { 5, 15, 45 })
})
{
    foreach (var target in targets)
    {
        var user = $"{category}-{target}";
        for (var i = 0; i < target - 1; i++)
        {
            if (category == "comebacks") SeedHistory(user, 0, new[] { (1, false) }, i * 2);
            SeedHistory(user, 0, new[] { (1, true) }, i * 2 + 1);
        }
        await database.SaveChangesAsync();
        var tier = (await service.GetProgressAsync(user)).Achievements.Single(a => a.CategoryId == category && a.Target == target);
        Check(!tier.Unlocked && tier.Current == target - 1, $"{category} tier below {target}.");
        if (category == "comebacks") SeedHistory(user, 0, new[] { (1, false) }, target * 2);
        SeedHistory(user, 0, new[] { (1, true) }, target * 2 + 1);
        await database.SaveChangesAsync();
        Check((await service.GetProgressAsync(user)).Achievements.Single(a => a.Id == tier.Id).Unlocked, $"{category} tier at {target}.");
    }
}

await using var sqlServer = new ProgressDbContext(new DbContextOptionsBuilder<ProgressDbContext>()
    .UseSqlServer("Server=localhost;Database=ProgressSchemaCheck;Integrated Security=true;TrustServerCertificate=true",
        sql => sql.MigrationsHistoryTable("__ProgressMigrationsHistory")).Options);
var sqlScript = sqlServer.GetService<IMigrator>().GenerateScript();
Check(sqlScript.Contains("CREATE TABLE [QuizRounds]"), "SQL Server migration must generate valid table DDL.");
Check(!sqlServer.Database.HasPendingModelChanges(), "SQL Server progress model must match its migration.");
Console.WriteLine("PASS: migrations, ownership, grading, retries, progressive XP boundaries, all achievement tier thresholds, difficult-word thresholds/ranking/limit/modes/removal, persistence, duplicate/concurrent guards and SQL Server schema.");
