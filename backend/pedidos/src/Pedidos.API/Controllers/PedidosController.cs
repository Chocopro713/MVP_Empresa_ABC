using Microsoft.AspNetCore.Mvc;
using Pedidos.Application.DTOs;
using Pedidos.Application.Interfaces;
using Pedidos.API.Models;

namespace Pedidos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PedidosController : ControllerBase
{
    private readonly IPedidoService _pedidoService;
    private readonly ILogger<PedidosController> _logger;

    public PedidosController(IPedidoService pedidoService, ILogger<PedidosController> logger)
    {
        _pedidoService = pedidoService;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene todos los pedidos
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PedidoDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IEnumerable<PedidoDto>>>> GetAll([FromQuery] string? search = null)
    {
        _logger.LogInformation("Obteniendo todos los pedidos. Búsqueda: {Search}", search);
        var pedidos = await _pedidoService.GetAllAsync();
        
        // Filtrar por búsqueda si se proporciona
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            pedidos = pedidos.Where(p => 
                p.NumeroOrden.ToLower().Contains(search) || 
                p.Estado.ToLower().Contains(search) ||
                p.DireccionEnvio.ToLower().Contains(search) ||
                p.Items.Any(i => i.Nombre.ToLower().Contains(search))
            );
        }
        
        return Ok(ApiResponse<IEnumerable<PedidoDto>>.Ok(pedidos, "Pedidos obtenidos exitosamente"));
    }

    /// <summary>
    /// Obtiene un pedido por su ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<PedidoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<PedidoDto>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PedidoDto>>> GetById(string id)
    {
        _logger.LogInformation("Obteniendo pedido con ID: {Id}", id);
        var pedido = await _pedidoService.GetByIdAsync(id);
        if (pedido is null)
        {
            return NotFound(ApiResponse<PedidoDto>.NotFound($"Pedido con ID {id} no encontrado"));
        }
        return Ok(ApiResponse<PedidoDto>.Ok(pedido, "Pedido obtenido exitosamente"));
    }

    /// <summary>
    /// Obtiene pedidos por usuario
    /// </summary>
    [HttpGet("usuario/{usuarioId}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PedidoDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IEnumerable<PedidoDto>>>> GetByUsuario(string usuarioId)
    {
        _logger.LogInformation("Obteniendo pedidos del usuario: {UsuarioId}", usuarioId);
        var pedidos = await _pedidoService.GetByUsuarioIdAsync(usuarioId);
        return Ok(ApiResponse<IEnumerable<PedidoDto>>.Ok(pedidos, "Pedidos del usuario obtenidos exitosamente"));
    }

    /// <summary>
    /// Crea un nuevo pedido
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<PedidoDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<PedidoDto>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<PedidoDto>>> Create([FromBody] CreatePedidoDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<PedidoDto>.BadRequest("Datos inválidos", errors));
        }

        _logger.LogInformation("Creando nuevo pedido para usuario: {UsuarioId}", dto.UsuarioId);
        var pedido = await _pedidoService.CreateAsync(dto);
        var response = ApiResponse<PedidoDto>.Created(pedido, "Pedido creado exitosamente");
        return CreatedAtAction(nameof(GetById), new { id = pedido.Id }, response);
    }

    /// <summary>
    /// Actualiza un pedido existente
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse>> Update(string id, [FromBody] UpdatePedidoDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse.BadRequest("Datos inválidos", errors));
        }

        _logger.LogInformation("Actualizando pedido con ID: {Id}", id);
        var result = await _pedidoService.UpdateAsync(id, dto);
        if (!result)
        {
            return NotFound(ApiResponse.NotFound($"Pedido con ID {id} no encontrado"));
        }
        return Ok(ApiResponse.OkNoContent("Pedido actualizado exitosamente"));
    }

    /// <summary>
    /// Elimina un pedido
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse>> Delete(string id)
    {
        _logger.LogInformation("Eliminando pedido con ID: {Id}", id);
        var result = await _pedidoService.DeleteAsync(id);
        if (!result)
        {
            return NotFound(ApiResponse.NotFound($"Pedido con ID {id} no encontrado"));
        }
        return Ok(ApiResponse.OkNoContent("Pedido eliminado exitosamente"));
    }
}
