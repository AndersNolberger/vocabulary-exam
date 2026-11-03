using Microsoft.EntityFrameworkCore;
using VocabularyExam.Api.Data;
using VocabularyExam.Api.Dtos;

namespace VocabularyExam.Api.Services
{
    public class QuizService : IQuizService
    {
        private const int OptionCount = 4;
        private readonly AppDbContext _context;

        public QuizService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<QuizQuestionDto>> GetQuizQuestionsAsync(int wordSetId, int questionCount, bool typedAnswers, string userId)
        {
            var pairs = await _context.WordPairs
                .Where(wp => wp.WordSetId == wordSetId && wp.WordSet!.UserId == userId)
                .ToListAsync();

            var random = new Random();
            var allForeignWords = pairs.Select(pair => pair.ForeignWord).Distinct().ToList();

            return pairs
                .OrderBy(_ => random.Next())
                .Take(questionCount)
                .Select(pair => new QuizQuestionDto
                {
                    Id = pair.Id,
                    SwedishWord = pair.SwedishWord,
                    Prompt = pair.SwedishWord,
                    IsTypedAnswer = typedAnswers,
                    ForeignOptions = typedAnswers
                        ? new List<string>()
                        : BuildOptions(pair.ForeignWord, allForeignWords, random)
                })
                .ToList();
        }

        public async Task<QuizAnswerResultDto> SubmitAnswerAsync(int questionId, string userAnswer, string userId)
        {
            var pair = await _context.WordPairs
                .Include(wp => wp.WordSet)
                .FirstOrDefaultAsync(wp => wp.Id == questionId);
            if (pair?.WordSet?.UserId != userId) return new QuizAnswerResultDto();

            return EvaluateAnswer(pair.ForeignWord, userAnswer);
        }

        public static QuizAnswerResultDto EvaluateAnswer(string expectedAnswer, string userAnswer)
        {
            var expected = expectedAnswer.Trim();
            var answer = userAnswer.Trim();
            var correct = string.Equals(expected, answer, StringComparison.Ordinal);
            return new QuizAnswerResultDto
            {
                IsCorrect = correct,
                CapitalizationOnly = !correct && string.Equals(expected, answer, StringComparison.OrdinalIgnoreCase)
            };
        }

        private static List<string> BuildOptions(string correct, List<string> all, Random random)
        {
            var options = all.Where(w => w != correct).OrderBy(_ => random.Next()).Take(OptionCount - 1).ToList();
            options.Add(correct);
            return options.OrderBy(_ => random.Next()).ToList();
        }
    }
}
