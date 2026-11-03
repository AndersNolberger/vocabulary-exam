using System.Collections.Generic;

namespace VocabularyExam.Api.Models
{
    public class WordSet
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string UserId { get; set; }
        public string ForeignLanguage { get; set; } = "German";
        public List<WordPair> WordPairs { get; set; }

        public WordSet()
        {
            WordPairs = new List<WordPair>();
        }
    }
}