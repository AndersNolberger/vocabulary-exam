using Microsoft.EntityFrameworkCore;
using VocabularyExam.Api.Data;
using VocabularyExam.Api.Dtos;
using VocabularyExam.Api.Models;

namespace VocabularyExam.Api.Services
{
    public class WordSetService : IWordSetService
    {
        private readonly AppDbContext _context;

        public WordSetService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<WordSetDto> CreateWordSetAsync(string userId, WordSetDto wordSetDto)
        {
            var wordSet = new WordSet
            {
                Name = wordSetDto.Name,
                UserId = userId,
                WordPairs = wordSetDto.WordPairs.Select(wp => new WordPair
                {
                    SwedishWord = wp.SwedishWord,
                    ForeignWord = wp.ForeignWord,
                    ExampleAndInflections = wp.ExampleAndInflections
                }).ToList()
            };

            _context.WordSets.Add(wordSet);
            await _context.SaveChangesAsync();

            return ToDto(wordSet);
        }

        public async Task<IEnumerable<WordSetDto>> GetWordSetsByUserIdAsync(string userId)
        {
            var sets = await _context.WordSets
                .Include(ws => ws.WordPairs)
                .Where(ws => ws.UserId == userId)
                .OrderByDescending(ws => ws.Id)
                .ToListAsync();
            return sets.Select(ToDto).ToList();
        }

        public async Task<WordSetDto?> GetWordSetByIdAsync(int wordSetId, string userId)
        {
            var wordSet = await _context.WordSets
                .Include(ws => ws.WordPairs)
                .FirstOrDefaultAsync(ws => ws.Id == wordSetId && ws.UserId == userId);
            return wordSet == null ? null : ToDto(wordSet);
        }

        public async Task<WordSetDto?> UpdateWordSetAsync(int wordSetId, string userId, WordSetDto wordSetDto)
        {
            var wordSet = await _context.WordSets
                .Include(ws => ws.WordPairs)
                .FirstOrDefaultAsync(ws => ws.Id == wordSetId && ws.UserId == userId);
            if (wordSet == null) return null;

            wordSet.Name = wordSetDto.Name;
            _context.WordPairs.RemoveRange(wordSet.WordPairs);
            wordSet.WordPairs = wordSetDto.WordPairs.Select(wp => new WordPair
            {
                SwedishWord = wp.SwedishWord,
                ForeignWord = wp.ForeignWord,
                ExampleAndInflections = wp.ExampleAndInflections
            }).ToList();

            await _context.SaveChangesAsync();
            return ToDto(wordSet);
        }

        public async Task<bool> DeleteWordSetAsync(int wordSetId, string userId)
        {
            var wordSet = await _context.WordSets
                .FirstOrDefaultAsync(ws => ws.Id == wordSetId && ws.UserId == userId);
            if (wordSet == null) return false;

            _context.WordSets.Remove(wordSet);
            await _context.SaveChangesAsync();
            return true;
        }

        private static WordSetDto ToDto(WordSet ws) => new()
        {
            Id = ws.Id,
            Name = ws.Name,
            WordPairs = ws.WordPairs.Select(wp => new WordPairDto
            {
                Id = wp.Id,
                SwedishWord = wp.SwedishWord,
                ForeignWord = wp.ForeignWord,
                ExampleAndInflections = wp.ExampleAndInflections
            }).ToList()
        };
    }
}
