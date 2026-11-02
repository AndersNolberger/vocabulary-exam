using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocabularyExam.Api.Dtos;
using VocabularyExam.Api.Services;

namespace VocabularyExam.Api.Controllers
{
    public class SubmitAnswerRequest
    {
        public int QuestionId { get; set; }
        public string Answer { get; set; } = string.Empty;
    }

    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class QuizController : ControllerBase
    {
        private readonly IQuizService _quizService;

        public QuizController(IQuizService quizService)
        {
            _quizService = quizService;
        }

        private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        [HttpGet("{wordSetId}")]
        public async Task<ActionResult<IEnumerable<QuizQuestionDto>>> GetQuizQuestions(
            int wordSetId, [FromQuery] int count = 10, [FromQuery] bool typed = false)
        {
            var questions = (await _quizService.GetQuizQuestionsAsync(wordSetId, count, typed, UserId)).ToList();
            if (questions.Count == 0) return NotFound();
            return Ok(questions);
        }

        [HttpPost("submit")]
        public async Task<ActionResult<QuizAnswerResultDto>> SubmitAnswer([FromBody] SubmitAnswerRequest request)
        {
            return Ok(await _quizService.SubmitAnswerAsync(request.QuestionId, request.Answer, UserId));
        }
    }
}
