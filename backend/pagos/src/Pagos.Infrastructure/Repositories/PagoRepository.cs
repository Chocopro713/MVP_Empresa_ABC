using MongoDB.Driver;
using Pagos.Domain.Entities;
using Pagos.Domain.Interfaces;
using Pagos.Infrastructure.Data;

namespace Pagos.Infrastructure.Repositories;

public class PagoRepository : IPagoRepository
{
    private readonly MongoDbContext _context;

    public PagoRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Pago>> GetAllAsync()
    {
        return await _context.Pagos.Find(_ => true).ToListAsync();
    }

    public async Task<Pago?> GetByIdAsync(string id)
    {
        return await _context.Pagos.Find(p => p.Id == id).FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<Pago>> GetByPedidoIdAsync(string pedidoId)
    {
        return await _context.Pagos.Find(p => p.PedidoId == pedidoId).ToListAsync();
    }

    public async Task<IEnumerable<Pago>> GetByUsuarioIdAsync(string usuarioId)
    {
        return await _context.Pagos.Find(p => p.UsuarioId == usuarioId).ToListAsync();
    }

    public async Task<Pago> CreateAsync(Pago pago)
    {
        pago.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        await _context.Pagos.InsertOneAsync(pago);
        return pago;
    }

    public async Task<bool> UpdateAsync(Pago pago)
    {
        var result = await _context.Pagos.ReplaceOneAsync(p => p.Id == pago.Id, pago);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _context.Pagos.DeleteOneAsync(p => p.Id == id);
        return result.DeletedCount > 0;
    }

    public async Task<bool> ExistsAsync(string id)
    {
        return await _context.Pagos.Find(p => p.Id == id).AnyAsync();
    }
}
