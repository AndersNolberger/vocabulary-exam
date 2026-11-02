using System.ComponentModel.DataAnnotations;

namespace VocabularyExam.Api.Dtos
{
    public class WordPairDto
    {
        [Required]
        public string SwedishWord { get; set; }

        [Required]
        public string ForeignWord { get; set; }
    }
}