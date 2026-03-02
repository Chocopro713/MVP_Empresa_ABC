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

    public async Task<ServiceResult<UsuarioDto>> CreateAsync(CreateUsuarioDto dto)
    {
        _logger.LogInformation("Creando nuevo usuario: {Email}", dto.Email);
        
        // Validar unicidad de email
        var existingByEmail = await _repository.GetByEmailAsync(dto.Email);
        if (existingByEmail is not null)
        {
            _logger.LogWarning("Email ya registrado: {Email}", dto.Email);
            return ServiceResult<UsuarioDto>.Fail($"El correo electrónico '{dto.Email}' ya está registrado");
        }

        // Validar unicidad de teléfono
        var existingByTelefono = await _repository.GetByTelefonoAsync(dto.Telefono);
        if (existingByTelefono is not null)
        {
            _logger.LogWarning("Teléfono ya registrado: {Telefono}", dto.Telefono);
            return ServiceResult<UsuarioDto>.Fail($"El número de teléfono '{dto.Telefono}' ya está registrado");
        }
        
        var usuario = new Usuario
        {
            Nombre = dto.Nombre,
            Email = dto.Email,
            Telefono = dto.Telefono,
            Direccion = dto.Direccion,
            Rol = dto.Rol,
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };

        var created = await _repository.CreateAsync(usuario);
        _logger.LogInformation("Usuario creado con ID: {Id}", created.Id);
        
        return ServiceResult<UsuarioDto>.Ok(MapToDto(created));
    }

    public async Task<ServiceResult> UpdateAsync(string id, UpdateUsuarioDto dto)
    {
        _logger.LogInformation("Actualizando usuario con ID: {Id}", id);
        
        var usuario = await _repository.GetByIdAsync(id);
        if (usuario is null)
        {
            _logger.LogWarning("Usuario no encontrado: {Id}", id);
            return ServiceResult.Fail("Usuario no encontrado");
        }

        // Validar unicidad de email (si cambió)
        if (!string.Equals(usuario.Email, dto.Email, StringComparison.OrdinalIgnoreCase))
        {
            var existingByEmail = await _repository.GetByEmailAsync(dto.Email);
            if (existingByEmail is not null)
            {
                _logger.LogWarning("Email ya registrado: {Email}", dto.Email);
                return ServiceResult.Fail($"El correo electrónico '{dto.Email}' ya está registrado por otro usuario");
            }
        }

        // Validar unicidad de teléfono (si cambió)
        if (usuario.Telefono != dto.Telefono)
        {
            var existingByTelefono = await _repository.GetByTelefonoAsync(dto.Telefono);
            if (existingByTelefono is not null)
            {
                _logger.LogWarning("Teléfono ya registrado: {Telefono}", dto.Telefono);
                return ServiceResult.Fail($"El número de teléfono '{dto.Telefono}' ya está registrado por otro usuario");
            }
        }

        usuario.Nombre = dto.Nombre;
        usuario.Email = dto.Email;
        usuario.Telefono = dto.Telefono;
        usuario.Direccion = dto.Direccion;
        usuario.Rol = dto.Rol;
        usuario.Activo = dto.Activo;
        usuario.FechaActualizacion = DateTime.UtcNow;

        var updated = await _repository.UpdateAsync(usuario);
        return updated ? ServiceResult.Ok() : ServiceResult.Fail("Error al actualizar el usuario");
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
        usuario.Direccion,
        usuario.Rol,
        usuario.Activo,
        usuario.FechaCreacion
    );
}
