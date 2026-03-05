using Microsoft.AspNetCore.Mvc;
using Usuarios.Application.DTOs;
using Usuarios.Application.Interfaces;
using Usuarios.API.Models;

namespace Usuarios.API.Controllers;

/// <summary>
/// Controlador para seed de datos iniciales (solo para desarrollo)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class SeedController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUsuarioService _usuarioService;
    private readonly ILogger<SeedController> _logger;
    private readonly IWebHostEnvironment _environment;

    public SeedController(
        IAuthService authService, 
        IUsuarioService usuarioService,
        ILogger<SeedController> logger,
        IWebHostEnvironment environment)
    {
        _authService = authService;
        _usuarioService = usuarioService;
        _logger = logger;
        _environment = environment;
    }

    /// <summary>
    /// Crea usuarios de prueba con contraseñas hasheadas
    /// Solo funciona si no hay usuarios admin existentes
    /// </summary>
    [HttpPost("usuarios")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<object>>> SeedUsuarios()
    {
        _logger.LogInformation("Iniciando seed de usuarios de prueba");
        
        // Verificar si ya existe un usuario admin
        var existingUsers = await _usuarioService.GetAllAsync();
        var hasAdmin = existingUsers.Any(u => u.Rol.ToLower() == "admin" || u.Rol.ToLower() == "administrador");
        
        if (hasAdmin && !_environment.IsDevelopment())
        {
            return BadRequest(ApiResponse.BadRequest("Ya existen usuarios administradores. El seed solo puede ejecutarse una vez."));
        }

        var usuariosCreados = new List<string>();
        var errores = new List<string>();

        // Usuarios de prueba
        var usuarios = new List<RegisterDto>
        {
            new() { Nombre = "Admin Sistema", Email = "admin@nexos.com", Password = "Admin123!", Telefono = "1234567890", Direccion = "Oficina Central" },
            new() { Nombre = "Juan Pérez", Email = "juan@example.com", Password = "Juan123!", Telefono = "1111111111", Direccion = "Calle 123" },
            new() { Nombre = "María García", Email = "maria@example.com", Password = "Maria123!", Telefono = "2222222222", Direccion = "Avenida 456" },
            new() { Nombre = "Carlos López", Email = "carlos@example.com", Password = "Carlos123!", Telefono = "3333333333", Direccion = "Boulevard 789" },
            new() { Nombre = "Ana Martínez", Email = "ana@example.com", Password = "Ana12345!", Telefono = "4444444444", Direccion = "Plaza 321" }
        };

        foreach (var usuario in usuarios)
        {
            try
            {
                var result = await _authService.RegisterAsync(usuario);
                if (result.Success)
                {
                    usuariosCreados.Add(usuario.Email);
                    _logger.LogInformation("Usuario creado: {Email}", usuario.Email);
                }
                else
                {
                    errores.Add($"{usuario.Email}: {result.ErrorMessage}");
                    _logger.LogWarning("Error creando usuario {Email}: {Error}", usuario.Email, result.ErrorMessage);
                }
            }
            catch (Exception ex)
            {
                errores.Add($"{usuario.Email}: {ex.Message}");
                _logger.LogError(ex, "Excepción al crear usuario {Email}", usuario.Email);
            }
        }

        // Actualizar el primer usuario como administrador
        var adminUser = (await _usuarioService.GetAllAsync()).FirstOrDefault(u => u.Email == "admin@nexos.com");
        if (adminUser != null)
        {
            await _usuarioService.UpdateAsync(adminUser.Id, new UpdateUsuarioDto
            {
                Nombre = adminUser.Nombre,
                Email = adminUser.Email,
                Telefono = adminUser.Telefono,
                Direccion = adminUser.Direccion,
                Rol = "Administrador",
                Activo = true
            });
            _logger.LogInformation("Usuario {Email} actualizado como Administrador", adminUser.Email);
        }

        var response = new
        {
            Creados = usuariosCreados.Count,
            Usuarios = usuariosCreados,
            Errores = errores,
            Credenciales = new[]
            {
                new { Email = "admin@nexos.com", Password = "Admin123!", Rol = "Administrador" },
                new { Email = "juan@example.com", Password = "Juan123!", Rol = "Usuario" },
                new { Email = "maria@example.com", Password = "Maria123!", Rol = "Usuario" },
                new { Email = "carlos@example.com", Password = "Carlos123!", Rol = "Usuario" },
                new { Email = "ana@example.com", Password = "Ana12345!", Rol = "Usuario" }
            }
        };

        return Ok(ApiResponse<object>.Ok(response, $"Seed completado. {usuariosCreados.Count} usuarios creados."));
    }

    /// <summary>
    /// Obtiene información del ambiente actual
    /// </summary>
    [HttpGet("info")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public ActionResult<ApiResponse<object>> GetInfo()
    {
        var info = new
        {
            Ambiente = _environment.EnvironmentName,
            EsDesarrollo = _environment.IsDevelopment(),
            Timestamp = DateTime.UtcNow,
            Version = "2.0.0-jwt"
        };

        return Ok(ApiResponse<object>.Ok(info, "Información del sistema"));
    }
}
