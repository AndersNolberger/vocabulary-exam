namespace VocabularyExam.Api.Services
{
    public interface ISpellCheckService
    {
        bool IsWordCorrect(string word, bool ignoreCase = false);
        List<string> GetSuggestions(string word);
    }
}