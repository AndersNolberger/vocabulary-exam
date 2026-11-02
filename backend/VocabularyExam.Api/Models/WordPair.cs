namespace VocabularyExam.Api.Models
{
    public class WordPair
    {
        public int Id { get; set; }
        public string SwedishWord { get; set; } = string.Empty;
        public string ForeignWord { get; set; } = string.Empty;
        public int WordSetId { get; set; }
        public WordSet? WordSet { get; set; }
    }
}
