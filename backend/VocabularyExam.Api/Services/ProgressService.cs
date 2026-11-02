using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using VocabularyExam.Api.Data;
using VocabularyExam.Api.Dtos;
using VocabularyExam.Api.Models;

namespace VocabularyExam.Api.Services;

public class ProgressService(AppDbContext words, ProgressDbContext progress, IQuizService quiz)
{
    private sealed class RecordedQuestion
    {
        public QuizQuestionDto Question { get; set; } = new();
        public string ExpectedAnswer { get; set; } = string.Empty;
        public QuizAnswerResultDto? Result { get; set; }
    }

    private static List<RecordedQuestion> ReadQuestions(QuizRound round)
        => JsonSerializer.Deserialize<List<RecordedQuestion>>(round.QuestionsJson)
           ?? throw new InvalidOperationException("Quiz round questions are missing.");

    private static List<int> DifficultWordIds(IEnumerable<QuizRound> rounds, int wordSetId)
        => rounds.Where(r => r.WordSetId == wordSetId).SelectMany(ReadQuestions)
            .GroupBy(q => q.Question.Id)
            .Select(g => new { Id = g.Key, Wrong = g.Count(q => !q.Result!.IsCorrect), Total = g.Count() })
            .Where(w => w.Wrong >= 2 && w.Wrong * 5L >= w.Total * 2L)
            .OrderByDescending(w => (double)w.Wrong / w.Total)
            .ThenByDescending(w => w.Wrong).ThenBy(w => w.Id)
            .Select(w => w.Id).ToList();

    public async Task<QuizRoundDto?> StartRoundAsync(int wordSetId, bool typed, string? previousRoundId, string userId, bool difficultOnly = false)
    {
        if (!await words.WordSets.AnyAsync(w => w.Id == wordSetId && w.UserId == userId)) return null;

        List<RecordedQuestion> questions;
        if (previousRoundId != null)
        {
            var previous = await progress.QuizRounds.AsNoTracking().SingleOrDefaultAsync(r =>
                r.Id == previousRoundId && r.UserId == userId && r.WordSetId == wordSetId && r.CompletedAt != null);
            if (previous == null || previous.Typed != typed) return null;
            var currentIds = await words.WordPairs.Where(w => w.WordSetId == wordSetId).Select(w => w.Id).ToListAsync();
            questions = ReadQuestions(previous).Where(q => q.Result?.IsCorrect == false && currentIds.Contains(q.Question.Id))
                .Select(q => new RecordedQuestion { Question = q.Question, ExpectedAnswer = q.ExpectedAnswer }).ToList();
        }
        else
        {
            var selected = (await quiz.GetQuizQuestionsAsync(wordSetId, difficultOnly ? int.MaxValue : 10, typed, userId)).ToList();
            if (difficultOnly)
            {
                var difficult = DifficultWordIds(await GetCompletedAsync(userId), wordSetId);
                var byId = selected.ToDictionary(q => q.Id);
                selected = difficult.Where(byId.ContainsKey).Take(10).Select(id => byId[id]).ToList();
            }
            var answers = await words.WordPairs.Where(w => w.WordSetId == wordSetId && w.WordSet!.UserId == userId)
                .ToDictionaryAsync(w => w.Id, w => w.ForeignWord);
            if (selected.Any(q => !answers.ContainsKey(q.Id))) return null;
            questions = selected.Select(q => new RecordedQuestion { Question = q, ExpectedAnswer = answers[q.Id] }).ToList();
        }

        if (questions.Count == 0) return null;
        var round = new QuizRound
        {
            UserId = userId,
            WordSetId = wordSetId,
            Typed = typed,
            QuestionsJson = JsonSerializer.Serialize(questions)
        };
        progress.QuizRounds.Add(round);
        await progress.SaveChangesAsync();
        return new QuizRoundDto { RoundId = round.Id, Questions = questions.Select(q => q.Question).ToList() };
    }

    public async Task<TrackedAnswerDto?> SubmitAsync(string roundId, int questionId, string answer, string userId)
    {
        var round = await progress.QuizRounds.SingleOrDefaultAsync(r => r.Id == roundId && r.UserId == userId);
        if (round == null || !await words.WordSets.AnyAsync(w => w.Id == round.WordSetId && w.UserId == userId)) return null;
        var questions = ReadQuestions(round);
        var question = questions.SingleOrDefault(q => q.Question.Id == questionId);
        if (question == null) return null;

        if (question.Result == null)
        {
            question.Result = QuizService.EvaluateAnswer(question.ExpectedAnswer, answer);
            round.QuestionsJson = JsonSerializer.Serialize(questions);
            round.Version = Guid.NewGuid().ToString("N");
            if (questions.All(q => q.Result != null))
            {
                var previous = await GetCompletedAsync(userId);
                var before = BuildProgress(previous);
                round.CompletedAt = DateTime.UtcNow;
                round.Xp = 20 + questions.Count(q => q.Result!.IsCorrect) * 10;
                var after = BuildProgress(previous.Append(round).ToList());
                round.CompletionJson = JsonSerializer.Serialize(new RoundCompletionDto
                {
                    EarnedXp = round.Xp,
                    Level = after.Level,
                    LeveledUp = after.Level > before.Level,
                    NewAchievements = after.Achievements.Where(a => a.Unlocked &&
                        !before.Achievements.Single(b => b.Id == a.Id).Unlocked).ToList()
                });
            }
            await progress.SaveChangesAsync();
        }

        return new TrackedAnswerDto
        {
            IsCorrect = question.Result.IsCorrect,
            CapitalizationOnly = question.Result.CapitalizationOnly,
            Completion = round.CompletionJson == null ? null : JsonSerializer.Deserialize<RoundCompletionDto>(round.CompletionJson)
        };
    }

    private Task<List<QuizRound>> GetCompletedAsync(string userId)
        => progress.QuizRounds.AsNoTracking().Where(r => r.UserId == userId && r.CompletedAt != null)
            .OrderBy(r => r.CompletedAt).ThenBy(r => r.Id).ToListAsync();

    public async Task<ProgressDto> GetProgressAsync(string userId)
    {
        var rounds = await GetCompletedAsync(userId);
        var summary = BuildProgress(rounds);
        var sets = await words.WordSets.AsNoTracking().Include(w => w.WordPairs).Where(w => w.UserId == userId).ToListAsync();
        summary.WordSets = sets.Select(set =>
        {
            var attempts = rounds.Where(r => r.WordSetId == set.Id).Select(ReadQuestions).ToList();
            var answers = attempts.SelectMany(a => a).ToList();
            var latest = answers.GroupBy(a => a.Question.Id).Select(g => g.Last());
            return new WordSetStatisticsDto
            {
                WordSetId = set.Id,
                CompletedRounds = attempts.Count,
                AccuracyPercent = Percentage(answers.Count(a => a.Result!.IsCorrect), answers.Count),
                BestAccuracyPercent = attempts.Count == 0 ? 0 : attempts.Max(a => Percentage(a.Count(q => q.Result!.IsCorrect), a.Count)),
                WordsToPractice = latest.Count(q => q.Result!.IsCorrect == false && set.WordPairs.Any(w => w.Id == q.Question.Id)),
                DifficultWords = DifficultWordIds(rounds, set.Id).Count(id => set.WordPairs.Any(w => w.Id == id))
            };
        }).ToList();
        return summary;
    }

    private static double Percentage(int correct, int count) => count == 0 ? 0 : Math.Round(correct * 100.0 / count);

    private static ProgressDto BuildProgress(List<QuizRound> rounds)
    {
        var answers = rounds.SelectMany(ReadQuestions).ToList();
        var correct = answers.Count(q => q.Result!.IsCorrect);
        var perfect = rounds.Count(r => ReadQuestions(r).All(q => q.Result!.IsCorrect));
        var typedCorrect = rounds.Where(r => r.Typed).SelectMany(ReadQuestions).Count(q => q.Result!.IsCorrect);
        var lastResults = new Dictionary<int, bool>();
        var comebacks = 0;
        foreach (var answer in answers)
        {
            var isCorrect = answer.Result!.IsCorrect;
            if (isCorrect && lastResults.TryGetValue(answer.Question.Id, out var previous) && !previous) comebacks++;
            lastResults[answer.Question.Id] = isCorrect;
        }
        var achievements = new List<AchievementDto>();
        void AddTiers(string id, string title, string description, int current, params int[] targets)
        {
            for (var i = 0; i < targets.Length; i++)
                achievements.Add(new AchievementDto
                {
                    Id = i == 0 ? id : $"{id}-{i + 1}",
                    CategoryId = id,
                    Tier = i + 1,
                    Title = title,
                    Description = description,
                    Current = Math.Min(current, targets[i]),
                    Target = targets[i]
                });
        }
        AddTiers("first-round", "Första steget", "Slutför omgångar och bygg en vana.", rounds.Count, 1, 3, 9);
        AddTiers("perfect-round", "Fullträff!", "Få alla rätt i en omgång.", perfect, 1, 3, 9);
        AddTiers("fifty-correct", "Ordmagiker", "Samla rätta svar.", correct, 50, 150, 450);
        AddTiers("ten-rounds", "Övningshjälte", "Fortsätt slutföra omgångar.", rounds.Count, 10, 30, 90);
        AddTiers("typed-correct", "Tangenttrollkarl", "Skriv rätt svar utan svarsalternativ.", typedCorrect, 25, 75, 225);
        AddTiers("comebacks", "Revanschmästare", "Svara rätt efter att ditt senaste svar på ordet var fel.", comebacks, 5, 15, 45);
        return new ProgressDto
        {
            TotalXp = rounds.Sum(r => r.Xp),
            CompletedRounds = rounds.Count,
            CorrectAnswers = correct,
            TotalAnswers = answers.Count,
            Achievements = achievements
        };
    }
}
