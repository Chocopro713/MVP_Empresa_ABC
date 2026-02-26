using Usuarios.Application.DTOs;

namespace Usuarios.Application.Interfaces;

public interface IUsuarioService
{
    Task<IEnumerable<UsuarioDto>> GetAllAsync();
    Task<UsuarioDto?> GetByIdAsync(string id);
    Task<UsuarioDto> CreateAsync(CreateUsuarioDto dto);
    Task<bool> UpdateAsync(string id, UpdateUsuarioDto dto);
    Task<bool> DeleteAsync(string id);
}
