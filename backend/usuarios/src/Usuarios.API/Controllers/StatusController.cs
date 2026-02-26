using Microsoft.AspNetCore.Mvc;

namespace Usuarios.API.Controllers;

[ApiController]
[Route("[controller]")]
public class StatusController : ControllerBase
{
    private readonly ILogger<StatusController> _logger;

    public StatusController(ILogger<StatusController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Obtiene el estado detallado del servicio
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult GetStatus()
    {
        _logger.LogInformation("Status check requested");
        
        return Ok(new
        {
            service = "Usuarios API",
            version = "1.0.0",
            status = "running",
            timestamp = DateTime.UtcNow,
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
            machineName = Environment.MachineName,
            framework = System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription
        });
    }
}
