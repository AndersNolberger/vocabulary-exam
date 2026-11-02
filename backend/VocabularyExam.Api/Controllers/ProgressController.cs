using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VocabularyExam.Api.Dtos;
using VocabularyExam.Api.Services;

namespace VocabularyExam.Api.Controllers;

public class StartRoundRequest
{
    public int WordSetId { get; set; }
    public bool Typed { get; set; }
    public string? PreviousRoundId { get; set; }
    public bool DifficultOnly { get; set; }
}

public class RoundAnswerRequest
{
    public int QuestionId { get; set; }
    [Required]
    public string Answer { get; set; } = string.Empty;
}

[ApiController]
[Authorize]
[Route("api/progress")]
public class ProgressController(ProgressService progress) : ControllerBase
{
    private string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet]
    public async Task<ActionResult<ProgressDto>> Get()
    {
        if (string.IsNullOrEmpty(UserId)) return Unauthorized();
        return Ok(await progress.GetProgressAsync(UserId));
    }

    [HttpPost("rounds")]
    public async Task<ActionResult<QuizRoundDto>> Start(StartRoundRequest request)
    {
        if (string.IsNullOrEmpty(UserId)) return Unauthorized();
        var round = await progress.StartRoundAsync(request.WordSetId, request.Typed, request.PreviousRoundId, UserId, request.DifficultOnly);
        return round == null ? NotFound(new { message = "Inga ord finns för det valda förhöret. Gå tillbaka till Mina läxor." }) : Ok(round);
    }

    [HttpPost("rounds/{roundId}/answers")]
    public async Task<ActionResult<TrackedAnswerDto>> Answer(string roundId, RoundAnswerRequest request)
    {
        if (string.IsNullOrEmpty(UserId)) return Unauthorized();
        if (string.IsNullOrWhiteSpace(request.Answer)) return BadRequest(new { message = "Skriv ett svar." });
        try
        {
            var result = await progress.SubmitAsync(roundId, request.QuestionId, request.Answer, UserId);
            return result == null ? NotFound() : Ok(result);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new { message = "Omgången ändrades i en annan förfrågan. Försök igen." });
        }
    }
}
