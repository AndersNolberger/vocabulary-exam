namespace VocabularyExam.Api.Services
{
    public class SpellCheckService : ISpellCheckService
    {
        private readonly HashSet<string> _wordList;
        private readonly HashSet<string> _caseInsensitiveWordList;

        public SpellCheckService()
        {
            var path = Path.Combine(AppContext.BaseDirectory, "WordLists", "german.txt");
            _wordList = File.ReadAllLines(path)
                .Select(w => w.Trim())
                .Where(w => w.Length > 0)
                .ToHashSet(StringComparer.Ordinal);
            _caseInsensitiveWordList = new HashSet<string>(_wordList, StringComparer.OrdinalIgnoreCase);
        }

        private static string NormalizeWord(string word)
        {
            var normalized = word.Trim();
            var article = System.Text.RegularExpressions.Regex.Match(normalized, @"^(der|die|das)\s+",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase | System.Text.RegularExpressions.RegexOptions.CultureInvariant);
            return article.Success ? normalized[article.Length..].Trim() : normalized;
        }

        public bool IsWordCorrect(string word, bool ignoreCase = false)
        {
            var normalized = NormalizeWord(word);
            // An article identifies a noun, even when its lowercase spelling is also a valid verb.
            if (!ignoreCase && normalized != word.Trim() && normalized.Length > 0 && char.IsLower(normalized[0]))
                return false;

            return (ignoreCase ? _caseInsensitiveWordList : _wordList).Contains(normalized);
        }

        public List<string> GetSuggestions(string word)
        {
            var prefix = NormalizeWord(word);
            return _wordList.Where(w => w.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)).Take(10).ToList();
        }
    }
}
