namespace VocabularyExam.Api.Services
{
    public class SpellCheckService : ISpellCheckService
    {
        private readonly Dictionary<string, HashSet<string>> _wordLists;
        private readonly Dictionary<string, HashSet<string>> _caseInsensitiveWordLists;

        public SpellCheckService()
        {
            _wordLists = new Dictionary<string, HashSet<string>>(StringComparer.Ordinal)
            {
                ["German"] = LoadWordList("german.txt"),
                ["French"] = LoadWordList("french.txt")
            };
            _caseInsensitiveWordLists = _wordLists.ToDictionary(
                pair => pair.Key,
                pair => new HashSet<string>(pair.Value, StringComparer.OrdinalIgnoreCase),
                StringComparer.Ordinal);
        }

        private static HashSet<string> LoadWordList(string filename)
            => File.ReadAllLines(Path.Combine(AppContext.BaseDirectory, "WordLists", filename))
                .Select(word => word.Trim())
                .Where(word => word.Length > 0)
                .ToHashSet(StringComparer.Ordinal);

        private static string NormalizeWord(string word, string language)
        {
            var normalized = word.Trim();
            var articlePattern = language switch
            {
                "German" => @"^(der|die|das)\s+",
                "French" => @"^(le|la|les|un|une|des)\s+|^l'",
                _ => string.Empty
            };
            if (articlePattern.Length == 0) return normalized;
            var article = System.Text.RegularExpressions.Regex.Match(normalized, articlePattern,
                System.Text.RegularExpressions.RegexOptions.IgnoreCase | System.Text.RegularExpressions.RegexOptions.CultureInvariant);
            return article.Success ? normalized[article.Length..].Trim() : normalized;
        }

        public bool IsWordCorrect(string word, bool ignoreCase = false, string language = "German")
        {
            if (!_wordLists.TryGetValue(language, out var wordList)) return false;
            var normalized = NormalizeWord(word, language);
            // An article identifies a noun, even when its lowercase spelling is also a valid verb.
            if (language == "German" && !ignoreCase && normalized != word.Trim() && normalized.Length > 0 && char.IsLower(normalized[0]))
                return false;

            return (ignoreCase ? _caseInsensitiveWordLists[language] : wordList).Contains(normalized);
        }

        public List<string> GetSuggestions(string word, string language = "German")
        {
            if (!_wordLists.TryGetValue(language, out var wordList)) return new List<string>();
            var prefix = NormalizeWord(word, language);
            return wordList.Where(word => word.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)).Take(10).ToList();
        }
    }
}
