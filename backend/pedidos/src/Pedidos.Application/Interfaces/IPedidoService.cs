using Pedidos.Application.DTOs;

namespace Pedidos.Application.Interfaces;

public interface IPedidoService
{
    Task<IEnumerable<PedidoDto>> GetAllAsync();
    Task<PedidoDto?> GetByIdAsync(string id);
    Task<IEnumerable<PedidoDto>> GetByUsuarioIdAsync(string usuarioId);
    Task<PedidoDto> CreateAsync(CreatePedidoDto dto);
    Task<bool> UpdateAsync(string id, UpdatePedidoDto dto);
    Task<bool> DeleteAsync(string id);
}
