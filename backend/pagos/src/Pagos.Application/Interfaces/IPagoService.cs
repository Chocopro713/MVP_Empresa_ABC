using Pagos.Application.DTOs;

namespace Pagos.Application.Interfaces;

public interface IPagoService
{
    Task<IEnumerable<PagoDto>> GetAllAsync();
    Task<PagoDto?> GetByIdAsync(string id);
    Task<IEnumerable<PagoDto>> GetByPedidoIdAsync(string pedidoId);
    Task<IEnumerable<PagoDto>> GetByUsuarioIdAsync(string usuarioId);
    Task<PagoDto> CreateAsync(CreatePagoDto dto);
    Task<bool> UpdateAsync(string id, UpdatePagoDto dto);
    Task<bool> DeleteAsync(string id);
}
