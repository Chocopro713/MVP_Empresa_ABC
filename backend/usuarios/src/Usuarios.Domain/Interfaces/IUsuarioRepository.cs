using Usuarios.Domain.Entities;

namespace Usuarios.Domain.Interfaces;

public interface IUsuarioRepository
{
    Task<IEnumerable<Usuario>> GetAllAsync();
    Task<Usuario?> GetByIdAsync(string id);
    Task<Usuario?> GetByEmailAsync(string email);
    Task<Usuario?> GetByTelefonoAsync(string telefono);
    Task<Usuario> CreateAsync(Usuario usuario);
    Task<bool> UpdateAsync(Usuario usuario);
    Task<bool> DeleteAsync(string id);
    Task<bool> ExistsAsync(string id);
}
