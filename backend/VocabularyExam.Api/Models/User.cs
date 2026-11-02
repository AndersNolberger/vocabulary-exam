using System.ComponentModel.DataAnnotations;

namespace VocabularyExam.Api.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Email { get; set; }

        [Required]
        public string Name { get; set; }

        public string GoogleId { get; set; }

        public string MicrosoftId { get; set; }
    }
}