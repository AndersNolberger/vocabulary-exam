using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace VocabularyExam.Api.Dtos
{
    public class WordSetDto
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        [RegularExpression("^(German|French)$")]
        public string ForeignLanguage { get; set; } = "German";

        [Required]
        [MinLength(1)]
        public List<WordPairDto> WordPairs { get; set; } = new();
    }
}