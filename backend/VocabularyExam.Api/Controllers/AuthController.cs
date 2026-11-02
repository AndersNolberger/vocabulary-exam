using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.MicrosoftAccount;
using Microsoft.AspNetCore.Mvc;

namespace VocabularyExam.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        [HttpGet("session")]
        public IActionResult GetSession()
            => Ok(new { IsAuthenticated = User.Identity?.IsAuthenticated == true });

        [HttpGet("login/microsoft")]
        public IActionResult LoginWithMicrosoft([FromQuery] string returnUrl = "/")
            => Challenge(new AuthenticationProperties { RedirectUri = returnUrl }, MicrosoftAccountDefaults.AuthenticationScheme);
    }
}
