namespace VocabularyExam.Api.Dtos
{
    public class QuizQuestionDto
    {
        public int Id { get; set; }
        public string SwedishWord { get; set; } = string.Empty;
        public string Prompt { get; set; } = string.Empty;
        public List<string> GermanOptions { get; set; } = new();
        public bool IsTypedAnswer { get; set; }
    }
}
