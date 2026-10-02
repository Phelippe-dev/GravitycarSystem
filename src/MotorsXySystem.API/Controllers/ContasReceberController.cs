using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MotorsXySystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ContasReceberController : ControllerBase
{
    [HttpGet]
    public IActionResult Listar() => Ok(new object[0]);
}
