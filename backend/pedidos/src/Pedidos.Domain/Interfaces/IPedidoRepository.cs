using Pedidos.Domain.Entities;

namespace Pedidos.Domain.Interfaces;

public interface IPedidoRepository
{
    Task<IEnumerable<Pedido>> GetAllAsync();
    Task<Pedido?> GetByIdAsync(string id);
    Task<IEnumerable<Pedido>> GetByUsuarioIdAsync(string usuarioId);
    Task<Pedido> CreateAsync(Pedido pedido);
    Task<bool> UpdateAsync(Pedido pedido);
    Task<bool> DeleteAsync(string id);
    Task<bool> ExistsAsync(string id);
}
