using VocabularyExam.Api.Dtos;

namespace VocabularyExam.Api.Services
{
    public interface IQuizService
    {
        Task<IEnumerable<QuizQuestionDto>> GetQuizQuestionsAsync(int wordSetId, int questionCount, bool typedAnswers, string userId);
        Task<QuizAnswerResultDto> SubmitAnswerAsync(int questionId, string userAnswer, string userId);
    }
}