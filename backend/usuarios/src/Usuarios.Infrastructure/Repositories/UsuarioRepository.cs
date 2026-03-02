using MongoDB.Driver;
using Usuarios.Domain.Entities;
using Usuarios.Domain.Interfaces;
using Usuarios.Infrastructure.Data;

namespace Usuarios.Infrastructure.Repositories;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly MongoDbContext _context;

    public UsuarioRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Usuario>> GetAllAsync()
    {
        return await _context.Usuarios.Find(_ => true).ToListAsync();
    }

    public async Task<Usuario?> GetByIdAsync(string id)
    {
        return await _context.Usuarios.Find(u => u.Id == id).FirstOrDefaultAsync();
    }

    public async Task<Usuario?> GetByEmailAsync(string email)
    {
        return await _context.Usuarios.Find(u => u.Email.ToLower() == email.ToLower()).FirstOrDefaultAsync();
    }

    public async Task<Usuario?> GetByTelefonoAsync(string telefono)
    {
        return await _context.Usuarios.Find(u => u.Telefono == telefono).FirstOrDefaultAsync();
    }

    public async Task<Usuario> CreateAsync(Usuario usuario)
    {
        usuario.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        await _context.Usuarios.InsertOneAsync(usuario);
        return usuario;
    }

    public async Task<bool> UpdateAsync(Usuario usuario)
    {
        var result = await _context.Usuarios.ReplaceOneAsync(u => u.Id == usuario.Id, usuario);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _context.Usuarios.DeleteOneAsync(u => u.Id == id);
        return result.DeletedCount > 0;
    }

    public async Task<bool> ExistsAsync(string id)
    {
        return await _context.Usuarios.Find(u => u.Id == id).AnyAsync();
    }
}
