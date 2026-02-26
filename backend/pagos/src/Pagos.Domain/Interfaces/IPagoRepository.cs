using Pagos.Domain.Entities;

namespace Pagos.Domain.Interfaces;

public interface IPagoRepository
{
    Task<IEnumerable<Pago>> GetAllAsync();
    Task<Pago?> GetByIdAsync(string id);
    Task<IEnumerable<Pago>> GetByPedidoIdAsync(string pedidoId);
    Task<IEnumerable<Pago>> GetByUsuarioIdAsync(string usuarioId);
    Task<Pago> CreateAsync(Pago pago);
    Task<bool> UpdateAsync(Pago pago);
    Task<bool> DeleteAsync(string id);
    Task<bool> ExistsAsync(string id);
}
