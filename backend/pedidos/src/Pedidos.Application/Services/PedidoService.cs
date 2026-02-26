using Microsoft.Extensions.Logging;
using Pedidos.Application.DTOs;
using Pedidos.Application.Interfaces;
using Pedidos.Domain.Entities;
using Pedidos.Domain.Interfaces;

namespace Pedidos.Application.Services;

public class PedidoService : IPedidoService
{
    private readonly IPedidoRepository _repository;
    private readonly ILogger<PedidoService> _logger;

    public PedidoService(IPedidoRepository repository, ILogger<PedidoService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<IEnumerable<PedidoDto>> GetAllAsync()
    {
        _logger.LogInformation("Obteniendo todos los pedidos");
        var pedidos = await _repository.GetAllAsync();
        return pedidos.Select(MapToDto);
    }

    public async Task<PedidoDto?> GetByIdAsync(string id)
    {
        _logger.LogInformation("Obteniendo pedido con ID: {Id}", id);
        var pedido = await _repository.GetByIdAsync(id);
        return pedido is null ? null : MapToDto(pedido);
    }

    public async Task<IEnumerable<PedidoDto>> GetByUsuarioIdAsync(string usuarioId)
    {
        _logger.LogInformation("Obteniendo pedidos del usuario: {UsuarioId}", usuarioId);
        var pedidos = await _repository.GetByUsuarioIdAsync(usuarioId);
        return pedidos.Select(MapToDto);
    }

    public async Task<PedidoDto> CreateAsync(CreatePedidoDto dto)
    {
        _logger.LogInformation("Creando nuevo pedido para usuario: {UsuarioId}", dto.UsuarioId);
        
        var items = dto.Items.Select(i => new ItemPedido
        {
            ProductoId = i.ProductoId,
            Nombre = i.Nombre,
            Cantidad = i.Cantidad,
            PrecioUnitario = i.PrecioUnitario
        }).ToList();

        var pedido = new Pedido
        {
            UsuarioId = dto.UsuarioId,
            NumeroOrden = GenerarNumeroOrden(),
            Items = items,
            Total = items.Sum(i => i.Subtotal),
            Estado = "Pendiente",
            DireccionEnvio = dto.DireccionEnvio,
            FechaCreacion = DateTime.UtcNow
        };

        var created = await _repository.CreateAsync(pedido);
        _logger.LogInformation("Pedido creado con ID: {Id}, Orden: {NumeroOrden}", created.Id, created.NumeroOrden);
        
        return MapToDto(created);
    }

    public async Task<bool> UpdateAsync(string id, UpdatePedidoDto dto)
    {
        _logger.LogInformation("Actualizando pedido con ID: {Id}", id);
        
        var pedido = await _repository.GetByIdAsync(id);
        if (pedido is null)
        {
            _logger.LogWarning("Pedido no encontrado: {Id}", id);
            return false;
        }

        pedido.Estado = dto.Estado;
        pedido.DireccionEnvio = dto.DireccionEnvio;
        pedido.FechaActualizacion = DateTime.UtcNow;

        return await _repository.UpdateAsync(pedido);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        _logger.LogInformation("Eliminando pedido con ID: {Id}", id);
        return await _repository.DeleteAsync(id);
    }

    private static string GenerarNumeroOrden()
    {
        return $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}";
    }

    private static PedidoDto MapToDto(Pedido pedido) => new(
        pedido.Id,
        pedido.UsuarioId,
        pedido.NumeroOrden,
        pedido.Items.Select(i => new ItemPedidoDto(
            i.ProductoId,
            i.Nombre,
            i.Cantidad,
            i.PrecioUnitario,
            i.Subtotal
        )).ToList(),
        pedido.Total,
        pedido.Estado,
        pedido.DireccionEnvio,
        pedido.FechaCreacion
    );
}
