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
        public ActionResult<IEnumerable<string>> CheckSpelling([FromQuery] IEnumerable<string> words)
        {
            return Ok(words.Where(w => !_spellCheck.IsWordCorrect(w)).ToList());
        }

        [HttpGet("suggest")]
        public ActionResult<IEnumerable<string>> Suggest([FromQuery] string word)
        {
            return Ok(_spellCheck.GetSuggestions(word));
        }

        [HttpPost("check")]
        public ActionResult<IEnumerable<string>> CheckWords([FromBody] List<string> words, [FromQuery] bool ignoreCase = false)
        {
            if (words.Any(string.IsNullOrWhiteSpace))
                return BadRequest("Words must not be empty.");

            return Ok(words.Where(w => !_spellCheck.IsWordCorrect(w, ignoreCase)).Distinct().ToList());
        }
    }
}
