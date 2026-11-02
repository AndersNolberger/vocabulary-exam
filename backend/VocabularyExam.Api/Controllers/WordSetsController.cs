using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocabularyExam.Api.Dtos;
using VocabularyExam.Api.Services;

namespace VocabularyExam.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class WordSetsController : ControllerBase
    {
        private readonly IWordSetService _wordSetService;

        public WordSetsController(IWordSetService wordSetService)
        {
            _wordSetService = wordSetService;
        }

        private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        [HttpPost]
        public async Task<ActionResult<WordSetDto>> CreateWordSet([FromBody] WordSetDto wordSetDto)
        {
            var created = await _wordSetService.CreateWordSetAsync(UserId, wordSetDto);
            return CreatedAtAction(nameof(GetWordSet), new { id = created.Id }, created);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<WordSetDto>> GetWordSet(int id)
        {
            var wordSet = await _wordSetService.GetWordSetByIdAsync(id, UserId);
            return wordSet == null ? NotFound() : Ok(wordSet);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<WordSetDto>>> GetAllWordSets()
        {
            return Ok(await _wordSetService.GetWordSetsByUserIdAsync(UserId));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<WordSetDto>> UpdateWordSet(int id, [FromBody] WordSetDto wordSetDto)
        {
            var updated = await _wordSetService.UpdateWordSetAsync(id, UserId, wordSetDto);
            return updated == null ? NotFound() : Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWordSet(int id)
        {
            return await _wordSetService.DeleteWordSetAsync(id, UserId) ? NoContent() : NotFound();
        }
    }
}
