using Microsoft.Extensions.Logging;
using Pagos.Application.DTOs;
using Pagos.Application.Interfaces;
using Pagos.Domain.Entities;
using Pagos.Domain.Interfaces;

namespace Pagos.Application.Services;

public class PagoService : IPagoService
{
    private readonly IPagoRepository _repository;
    private readonly ILogger<PagoService> _logger;

    public PagoService(IPagoRepository repository, ILogger<PagoService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<IEnumerable<PagoDto>> GetAllAsync()
    {
        _logger.LogInformation("Obteniendo todos los pagos");
        var pagos = await _repository.GetAllAsync();
        return pagos.Select(MapToDto);
    }

    public async Task<PagoDto?> GetByIdAsync(string id)
    {
        _logger.LogInformation("Obteniendo pago con ID: {Id}", id);
        var pago = await _repository.GetByIdAsync(id);
        return pago is null ? null : MapToDto(pago);
    }

    public async Task<IEnumerable<PagoDto>> GetByPedidoIdAsync(string pedidoId)
    {
        _logger.LogInformation("Obteniendo pagos del pedido: {PedidoId}", pedidoId);
        var pagos = await _repository.GetByPedidoIdAsync(pedidoId);
        return pagos.Select(MapToDto);
    }

    public async Task<IEnumerable<PagoDto>> GetByUsuarioIdAsync(string usuarioId)
    {
        _logger.LogInformation("Obteniendo pagos del usuario: {UsuarioId}", usuarioId);
        var pagos = await _repository.GetByUsuarioIdAsync(usuarioId);
        return pagos.Select(MapToDto);
    }

    public async Task<PagoDto> CreateAsync(CreatePagoDto dto)
    {
        _logger.LogInformation("Creando nuevo pago para pedido: {PedidoId}", dto.PedidoId);
        
        var pago = new Pago
        {
            PedidoId = dto.PedidoId,
            UsuarioId = dto.UsuarioId,
            NumeroTransaccion = GenerarNumeroTransaccion(),
            Monto = dto.Monto,
            Moneda = dto.Moneda,
            MetodoPago = dto.MetodoPago,
            Estado = "Pendiente",
            FechaCreacion = DateTime.UtcNow
        };

        var created = await _repository.CreateAsync(pago);
        _logger.LogInformation("Pago creado con ID: {Id}, Transacción: {NumeroTransaccion}", 
            created.Id, created.NumeroTransaccion);
        
        return MapToDto(created);
    }

    public async Task<bool> UpdateAsync(string id, UpdatePagoDto dto)
    {
        _logger.LogInformation("Actualizando pago con ID: {Id}", id);
        
        var pago = await _repository.GetByIdAsync(id);
        if (pago is null)
        {
            _logger.LogWarning("Pago no encontrado: {Id}", id);
            return false;
        }

        pago.Estado = dto.Estado;
        pago.ReferenciaPago = dto.ReferenciaPago;
        
        if (dto.Estado == "Completado" || dto.Estado == "Rechazado")
        {
            pago.FechaProcesamiento = DateTime.UtcNow;
        }

        return await _repository.UpdateAsync(pago);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        _logger.LogInformation("Eliminando pago con ID: {Id}", id);
        return await _repository.DeleteAsync(id);
    }

    private static string GenerarNumeroTransaccion()
    {
        return $"TXN-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString()[..6].ToUpper()}";
    }

    private static PagoDto MapToDto(Pago pago) => new(
        pago.Id,
        pago.PedidoId,
        pago.UsuarioId,
        pago.NumeroTransaccion,
        pago.Monto,
        pago.Moneda,
        pago.MetodoPago,
        pago.Estado,
        pago.ReferenciaPago,
        pago.FechaCreacion,
        pago.FechaProcesamiento
    );
}
