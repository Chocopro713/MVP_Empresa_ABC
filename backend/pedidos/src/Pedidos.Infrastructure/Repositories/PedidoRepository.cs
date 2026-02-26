using MongoDB.Driver;
using Pedidos.Domain.Entities;
using Pedidos.Domain.Interfaces;
using Pedidos.Infrastructure.Data;

namespace Pedidos.Infrastructure.Repositories;

public class PedidoRepository : IPedidoRepository
{
    private readonly MongoDbContext _context;

    public PedidoRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Pedido>> GetAllAsync()
    {
        return await _context.Pedidos.Find(_ => true).ToListAsync();
    }

    public async Task<Pedido?> GetByIdAsync(string id)
    {
        return await _context.Pedidos.Find(p => p.Id == id).FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<Pedido>> GetByUsuarioIdAsync(string usuarioId)
    {
        return await _context.Pedidos.Find(p => p.UsuarioId == usuarioId).ToListAsync();
    }

    public async Task<Pedido> CreateAsync(Pedido pedido)
    {
        pedido.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        await _context.Pedidos.InsertOneAsync(pedido);
        return pedido;
    }

    public async Task<bool> UpdateAsync(Pedido pedido)
    {
        var result = await _context.Pedidos.ReplaceOneAsync(p => p.Id == pedido.Id, pedido);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _context.Pedidos.DeleteOneAsync(p => p.Id == id);
        return result.DeletedCount > 0;
    }

    public async Task<bool> ExistsAsync(string id)
    {
        return await _context.Pedidos.Find(p => p.Id == id).AnyAsync();
    }
}
