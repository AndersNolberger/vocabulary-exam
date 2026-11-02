namespace VocabularyExam.Api.Models;

public class QuizRound
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string UserId { get; set; } = string.Empty;
    public int WordSetId { get; set; }
    public bool Typed { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public int Xp { get; set; }
    public string QuestionsJson { get; set; } = "[]";
    public string? CompletionJson { get; set; }
    public string Version { get; set; } = Guid.NewGuid().ToString("N");
}
