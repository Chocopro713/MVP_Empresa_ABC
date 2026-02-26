using Microsoft.Extensions.Logging;
using Usuarios.Application.DTOs;
using Usuarios.Application.Interfaces;
using Usuarios.Domain.Entities;
using Usuarios.Domain.Interfaces;

namespace Usuarios.Application.Services;

public class UsuarioService : IUsuarioService
{
    private readonly IUsuarioRepository _repository;
    private readonly ILogger<UsuarioService> _logger;

    public UsuarioService(IUsuarioRepository repository, ILogger<UsuarioService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<IEnumerable<UsuarioDto>> GetAllAsync()
    {
        _logger.LogInformation("Obteniendo todos los usuarios");
        var usuarios = await _repository.GetAllAsync();
        return usuarios.Select(MapToDto);
    }

    public async Task<UsuarioDto?> GetByIdAsync(string id)
    {
        _logger.LogInformation("Obteniendo usuario con ID: {Id}", id);
        var usuario = await _repository.GetByIdAsync(id);
        return usuario is null ? null : MapToDto(usuario);
    }

    public async Task<UsuarioDto> CreateAsync(CreateUsuarioDto dto)
    {
        _logger.LogInformation("Creando nuevo usuario: {Email}", dto.Email);
        
        var usuario = new Usuario
        {
            Nombre = dto.Nombre,
            Email = dto.Email,
            Telefono = dto.Telefono,
            Rol = dto.Rol,
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };

        var created = await _repository.CreateAsync(usuario);
        _logger.LogInformation("Usuario creado con ID: {Id}", created.Id);
        
        return MapToDto(created);
    }

    public async Task<bool> UpdateAsync(string id, UpdateUsuarioDto dto)
    {
        _logger.LogInformation("Actualizando usuario con ID: {Id}", id);
        
        var usuario = await _repository.GetByIdAsync(id);
        if (usuario is null)
        {
            _logger.LogWarning("Usuario no encontrado: {Id}", id);
            return false;
        }

        usuario.Nombre = dto.Nombre;
        usuario.Email = dto.Email;
        usuario.Telefono = dto.Telefono;
        usuario.Rol = dto.Rol;
        usuario.Activo = dto.Activo;
        usuario.FechaActualizacion = DateTime.UtcNow;

        return await _repository.UpdateAsync(usuario);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        _logger.LogInformation("Eliminando usuario con ID: {Id}", id);
        return await _repository.DeleteAsync(id);
    }

    private static UsuarioDto MapToDto(Usuario usuario) => new(
        usuario.Id,
        usuario.Nombre,
        usuario.Email,
        usuario.Telefono,
        usuario.Rol,
        usuario.Activo,
        usuario.FechaCreacion
    );
}
