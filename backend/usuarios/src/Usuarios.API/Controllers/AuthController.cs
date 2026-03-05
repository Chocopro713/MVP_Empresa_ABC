using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Usuarios.Application.DTOs;
using Usuarios.Application.Interfaces;
using Usuarios.API.Models;

namespace Usuarios.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Autentica un usuario con email y contraseña
    /// </summary>
    /// <param name="dto">Credenciales del usuario</param>
    /// <returns>Token JWT y datos del usuario</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<AuthResponseDto>.BadRequest("Datos inválidos", errors));
        }

        _logger.LogInformation("Intento de login para: {Email}", dto.Email);
        var result = await _authService.LoginAsync(dto);
        
        if (!result.Success)
        {
            return Unauthorized(ApiResponse<AuthResponseDto>.Unauthorized(result.ErrorMessage ?? "Credenciales inválidas"));
        }
        
        return Ok(ApiResponse<AuthResponseDto>.Ok(result.Data!, "Login exitoso"));
    }

    /// <summary>
    /// Registra un nuevo usuario
    /// </summary>
    /// <param name="dto">Datos del nuevo usuario</param>
    /// <returns>Token JWT y datos del usuario</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<AuthResponseDto>.BadRequest("Datos inválidos", errors));
        }

        _logger.LogInformation("Registro de nuevo usuario: {Email}", dto.Email);
        var result = await _authService.RegisterAsync(dto);
        
        if (!result.Success)
        {
            return Conflict(ApiResponse<AuthResponseDto>.Conflict(result.ErrorMessage ?? "Error al registrar usuario"));
        }
        
        return Created("", ApiResponse<AuthResponseDto>.Created(result.Data!, "Usuario registrado exitosamente"));
    }

    /// <summary>
    /// Refresca el token de acceso usando el refresh token
    /// </summary>
    /// <param name="dto">Token actual y refresh token</param>
    /// <returns>Nuevos tokens</returns>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> RefreshToken([FromBody] RefreshTokenDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<AuthResponseDto>.BadRequest("Datos inválidos", errors));
        }

        _logger.LogInformation("Refrescando token");
        var result = await _authService.RefreshTokenAsync(dto);
        
        if (!result.Success)
        {
            return Unauthorized(ApiResponse<AuthResponseDto>.Unauthorized(result.ErrorMessage ?? "Token inválido"));
        }
        
        return Ok(ApiResponse<AuthResponseDto>.Ok(result.Data!, "Token refrescado exitosamente"));
    }

    /// <summary>
    /// Cierra la sesión del usuario actual
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse>> Logout()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse.Unauthorized("No autorizado"));
        }

        _logger.LogInformation("Logout para usuario: {UserId}", userId);
        var result = await _authService.LogoutAsync(userId);
        
        if (!result.Success)
        {
            return BadRequest(ApiResponse.BadRequest(result.ErrorMessage ?? "Error al cerrar sesión"));
        }
        
        return Ok(ApiResponse.OkNoContent("Sesión cerrada exitosamente"));
    }

    /// <summary>
    /// Cambia la contraseña del usuario actual
    /// </summary>
    /// <param name="dto">Contraseña actual y nueva contraseña</param>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse>> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse.BadRequest("Datos inválidos", errors));
        }

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse.Unauthorized("No autorizado"));
        }

        _logger.LogInformation("Cambio de contraseña para usuario: {UserId}", userId);
        var result = await _authService.ChangePasswordAsync(userId, dto);
        
        if (!result.Success)
        {
            return BadRequest(ApiResponse.BadRequest(result.ErrorMessage ?? "Error al cambiar contraseña"));
        }
        
        return Ok(ApiResponse.OkNoContent("Contraseña cambiada exitosamente"));
    }

    /// <summary>
    /// Obtiene el perfil del usuario autenticado
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UsuarioAuthDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<UsuarioAuthDto>>> GetProfile()
    {
        var token = HttpContext.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
        
        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized(ApiResponse.Unauthorized("No autorizado"));
        }

        var result = await _authService.ValidateTokenAsync(token);
        
        if (!result.Success)
        {
            return Unauthorized(ApiResponse<UsuarioAuthDto>.Unauthorized(result.ErrorMessage ?? "Token inválido"));
        }
        
        return Ok(ApiResponse<UsuarioAuthDto>.Ok(result.Data!, "Perfil obtenido exitosamente"));
    }
}
