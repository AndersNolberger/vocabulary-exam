using VocabularyExam.Api.Dtos;

namespace VocabularyExam.Api.Services
{
    public interface IWordSetService
    {
        Task<WordSetDto> CreateWordSetAsync(string userId, WordSetDto wordSetDto);
        Task<IEnumerable<WordSetDto>> GetWordSetsByUserIdAsync(string userId);
        Task<WordSetDto?> GetWordSetByIdAsync(int wordSetId, string userId);
        Task<WordSetDto?> UpdateWordSetAsync(int wordSetId, string userId, WordSetDto wordSetDto);
        Task<bool> DeleteWordSetAsync(int wordSetId, string userId);
    }
}