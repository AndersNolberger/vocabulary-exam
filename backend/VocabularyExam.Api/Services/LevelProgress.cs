namespace VocabularyExam.Api.Services;

public record LevelProgress(int Level, long XpInLevel, long XpForNextLevel)
{
    public static LevelProgress FromXp(int totalXp)
    {
        var level = 1;
        long remaining = totalXp;
        long cost = 100;
        while (remaining >= cost)
        {
            remaining -= cost;
            level++;
            cost = (cost * 3 + 1) / 2;
        }
        return new LevelProgress(level, remaining, cost);
    }
}
