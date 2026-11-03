using Microsoft.AspNetCore.Mvc;
using VocabularyExam.Api.Services;

namespace VocabularyExam.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SpellCheckController : ControllerBase
    {
        private readonly ISpellCheckService _spellCheck;

        public SpellCheckController(ISpellCheckService spellCheck)
        {
            _spellCheck = spellCheck;
        }

        [HttpGet("check")]
        public ActionResult<IEnumerable<string>> CheckSpelling([FromQuery] IEnumerable<string> words, [FromQuery] string language = "German")
        {
            return Ok(words.Where(word => !_spellCheck.IsWordCorrect(word, language: language)).ToList());
        }

        [HttpGet("suggest")]
        public ActionResult<IEnumerable<string>> Suggest([FromQuery] string word, [FromQuery] string language = "German")
        {
            return Ok(_spellCheck.GetSuggestions(word, language));
        }

        [HttpPost("check")]
        public ActionResult<IEnumerable<string>> CheckWords([FromBody] List<string> words, [FromQuery] bool ignoreCase = false,
            [FromQuery] string language = "German")
        {
            if (words.Any(string.IsNullOrWhiteSpace))
                return BadRequest("Words must not be empty.");

            return Ok(words.Where(word => !_spellCheck.IsWordCorrect(word, ignoreCase, language)).Distinct().ToList());
        }
    }
}
