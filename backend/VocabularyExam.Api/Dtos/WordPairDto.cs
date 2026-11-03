using System.ComponentModel.DataAnnotations;

namespace VocabularyExam.Api.Dtos
{
    public class WordPairDto
    {
        public int Id { get; set; }

        [Required]
        public string SwedishWord { get; set; }

        [Required]
        public string ForeignWord { get; set; }
    }
}