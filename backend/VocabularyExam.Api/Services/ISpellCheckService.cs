namespace VocabularyExam.Api.Services
{
    public interface ISpellCheckService
    {
        bool IsWordCorrect(string word, bool ignoreCase = false, string language = "German");
        List<string> GetSuggestions(string word, string language = "German");
    }
}