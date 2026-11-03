using VocabularyExam.Api.Services;

namespace VocabularyExam.Api.Dtos;

public class AchievementDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public int Tier { get; set; }
    public int Current { get; set; }
    public int Target { get; set; }
    public bool Unlocked => Current >= Target;
}

public class WordSetStatisticsDto
{
    public int WordSetId { get; set; }
    public int CompletedRounds { get; set; }
    public double AccuracyPercent { get; set; }
    public double BestAccuracyPercent { get; set; }
    public int WordsToPractice { get; set; }
    public int DifficultWords { get; set; }
}

public class ProgressDto
{
    public int TotalXp { get; set; }
    public int Level => LevelProgress.FromXp(TotalXp).Level;
    public long XpInLevel => LevelProgress.FromXp(TotalXp).XpInLevel;
    public long XpForNextLevel => LevelProgress.FromXp(TotalXp).XpForNextLevel;
    public int CompletedRounds { get; set; }
    public int CorrectAnswers { get; set; }
    public int TotalAnswers { get; set; }
    public List<AchievementDto> Achievements { get; set; } = new();
    public List<WordSetStatisticsDto> WordSets { get; set; } = new();
}

public class QuizRoundDto
{
    public string RoundId { get; set; } = string.Empty;
    public List<QuizQuestionDto> Questions { get; set; } = new();
}

public class RoundCompletionDto
{
    public int EarnedXp { get; set; }
    public int Level { get; set; }
    public bool LeveledUp { get; set; }
    public List<AchievementDto> NewAchievements { get; set; } = new();
}

public class TrackedAnswerDto : QuizAnswerResultDto
{
    public string? CorrectAnswer { get; set; }
    public string? ExampleAndInflections { get; set; }
    public RoundCompletionDto? Completion { get; set; }
}
