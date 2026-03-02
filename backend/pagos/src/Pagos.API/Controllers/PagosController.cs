using Microsoft.AspNetCore.Mvc;
using Pagos.Application.DTOs;
using Pagos.Application.Interfaces;
using Pagos.API.Models;

namespace Pagos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PagosController : ControllerBase
{
    private readonly IPagoService _pagoService;
    private readonly ILogger<PagosController> _logger;

    public PagosController(IPagoService pagoService, ILogger<PagosController> logger)
    {
        _pagoService = pagoService;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene todos los pagos
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PagoDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IEnumerable<PagoDto>>>> GetAll([FromQuery] string? search = null)
    {
        _logger.LogInformation("Obteniendo todos los pagos. Búsqueda: {Search}", search);
        var pagos = await _pagoService.GetAllAsync();
        
        // Filtrar por búsqueda si se proporciona
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            pagos = pagos.Where(p => 
                p.NumeroTransaccion.ToLower().Contains(search) || 
                p.Estado.ToLower().Contains(search) ||
                p.MetodoPago.ToLower().Contains(search) ||
                p.Moneda.ToLower().Contains(search) ||
                (p.ReferenciaPago?.ToLower().Contains(search) ?? false)
            );
        }
        
        return Ok(ApiResponse<IEnumerable<PagoDto>>.Ok(pagos, "Pagos obtenidos exitosamente"));
    }

    /// <summary>
    /// Obtiene un pago por su ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<PagoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<PagoDto>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PagoDto>>> GetById(string id)
    {
        _logger.LogInformation("Obteniendo pago con ID: {Id}", id);
        var pago = await _pagoService.GetByIdAsync(id);
        if (pago is null)
        {
            return NotFound(ApiResponse<PagoDto>.NotFound($"Pago con ID {id} no encontrado"));
        }
        return Ok(ApiResponse<PagoDto>.Ok(pago, "Pago obtenido exitosamente"));
    }

    /// <summary>
    /// Obtiene pagos por pedido
    /// </summary>
    [HttpGet("pedido/{pedidoId}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PagoDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IEnumerable<PagoDto>>>> GetByPedido(string pedidoId)
    {
        _logger.LogInformation("Obteniendo pagos del pedido: {PedidoId}", pedidoId);
        var pagos = await _pagoService.GetByPedidoIdAsync(pedidoId);
        return Ok(ApiResponse<IEnumerable<PagoDto>>.Ok(pagos, "Pagos del pedido obtenidos exitosamente"));
    }

    /// <summary>
    /// Obtiene pagos por usuario
    /// </summary>
    [HttpGet("usuario/{usuarioId}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PagoDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IEnumerable<PagoDto>>>> GetByUsuario(string usuarioId)
    {
        _logger.LogInformation("Obteniendo pagos del usuario: {UsuarioId}", usuarioId);
        var pagos = await _pagoService.GetByUsuarioIdAsync(usuarioId);
        return Ok(ApiResponse<IEnumerable<PagoDto>>.Ok(pagos, "Pagos del usuario obtenidos exitosamente"));
    }

    /// <summary>
    /// Crea un nuevo pago
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<PagoDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<PagoDto>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<PagoDto>>> Create([FromBody] CreatePagoDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<PagoDto>.BadRequest("Datos inválidos", errors));
        }

        _logger.LogInformation("Creando nuevo pago para pedido: {PedidoId}", dto.PedidoId);
        var pago = await _pagoService.CreateAsync(dto);
        var response = ApiResponse<PagoDto>.Created(pago, "Pago creado exitosamente");
        return CreatedAtAction(nameof(GetById), new { id = pago.Id }, response);
    }

    /// <summary>
    /// Actualiza un pago existente
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse>> Update(string id, [FromBody] UpdatePagoDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse.BadRequest("Datos inválidos", errors));
        }

        _logger.LogInformation("Actualizando pago con ID: {Id}", id);
        var result = await _pagoService.UpdateAsync(id, dto);
        if (!result)
        {
            return NotFound(ApiResponse.NotFound($"Pago con ID {id} no encontrado"));
        }
        return Ok(ApiResponse.OkNoContent("Pago actualizado exitosamente"));
    }

    /// <summary>
    /// Elimina un pago
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse>> Delete(string id)
    {
        _logger.LogInformation("Eliminando pago con ID: {Id}", id);
        var result = await _pagoService.DeleteAsync(id);
        if (!result)
        {
            return NotFound(ApiResponse.NotFound($"Pago con ID {id} no encontrado"));
        }
        return Ok(ApiResponse.OkNoContent("Pago eliminado exitosamente"));
    }
}
