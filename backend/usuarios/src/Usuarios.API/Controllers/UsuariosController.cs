using Microsoft.AspNetCore.Mvc;
using Usuarios.Application.DTOs;
using Usuarios.Application.Interfaces;
using Usuarios.API.Models;

namespace Usuarios.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class UsuariosController : ControllerBase
{
    private readonly IUsuarioService _usuarioService;
    private readonly ILogger<UsuariosController> _logger;

    public UsuariosController(IUsuarioService usuarioService, ILogger<UsuariosController> logger)
    {
        _usuarioService = usuarioService;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene todos los usuarios
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<UsuarioDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IEnumerable<UsuarioDto>>>> GetAll([FromQuery] string? search = null)
    {
        _logger.LogInformation("Obteniendo todos los usuarios. Búsqueda: {Search}", search);
        var usuarios = await _usuarioService.GetAllAsync();
        
        // Filtrar por búsqueda si se proporciona
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            usuarios = usuarios.Where(u => 
                u.Nombre.ToLower().Contains(search) || 
                u.Email.ToLower().Contains(search) ||
                u.Telefono.Contains(search) ||
                u.Rol.ToLower().Contains(search)
            );
        }
        
        return Ok(ApiResponse<IEnumerable<UsuarioDto>>.Ok(usuarios, "Usuarios obtenidos exitosamente"));
    }

    /// <summary>
    /// Obtiene un usuario por su ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<UsuarioDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<UsuarioDto>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<UsuarioDto>>> GetById(string id)
    {
        _logger.LogInformation("Obteniendo usuario con ID: {Id}", id);
        var usuario = await _usuarioService.GetByIdAsync(id);
        if (usuario is null)
        {
            return NotFound(ApiResponse<UsuarioDto>.NotFound($"Usuario con ID {id} no encontrado"));
        }
        return Ok(ApiResponse<UsuarioDto>.Ok(usuario, "Usuario obtenido exitosamente"));
    }

    /// <summary>
    /// Crea un nuevo usuario
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<UsuarioDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<UsuarioDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<UsuarioDto>), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<UsuarioDto>>> Create([FromBody] CreateUsuarioDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<UsuarioDto>.BadRequest("Datos inválidos", errors));
        }

        _logger.LogInformation("Creando nuevo usuario: {Email}", dto.Email);
        var result = await _usuarioService.CreateAsync(dto);
        
        if (!result.Success)
        {
            return Conflict(ApiResponse<UsuarioDto>.Conflict(result.ErrorMessage ?? "Error al crear usuario", result.Errors));
        }
        
        var response = ApiResponse<UsuarioDto>.Created(result.Data!, "Usuario creado exitosamente");
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, response);
    }

    /// <summary>
    /// Actualiza un usuario existente
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse>> Update(string id, [FromBody] UpdateUsuarioDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse.BadRequest("Datos inválidos", errors));
        }

        _logger.LogInformation("Actualizando usuario con ID: {Id}", id);
        var result = await _usuarioService.UpdateAsync(id, dto);
        
        if (!result.Success)
        {
            // Diferenciar entre no encontrado y conflicto
            if (result.ErrorMessage == "Usuario no encontrado")
            {
                return NotFound(ApiResponse.NotFound($"Usuario con ID {id} no encontrado"));
            }
            return Conflict(ApiResponse.Conflict(result.ErrorMessage ?? "Error al actualizar usuario", result.Errors));
        }
        
        return Ok(ApiResponse.OkNoContent("Usuario actualizado exitosamente"));
    }

    /// <summary>
    /// Elimina un usuario
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse>> Delete(string id)
    {
        _logger.LogInformation("Eliminando usuario con ID: {Id}", id);
        var result = await _usuarioService.DeleteAsync(id);
        if (!result)
        {
            return NotFound(ApiResponse.NotFound($"Usuario con ID {id} no encontrado"));
        }
        return Ok(ApiResponse.OkNoContent("Usuario eliminado exitosamente"));
    }
}
