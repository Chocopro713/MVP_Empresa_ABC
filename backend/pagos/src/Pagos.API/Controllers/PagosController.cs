using Microsoft.AspNetCore.Mvc;
using Pagos.Application.DTOs;
using Pagos.Application.Interfaces;

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
    [ProducesResponseType(typeof(IEnumerable<PagoDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PagoDto>>> GetAll()
    {
        var pagos = await _pagoService.GetAllAsync();
        return Ok(pagos);
    }

    /// <summary>
    /// Obtiene un pago por su ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(PagoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PagoDto>> GetById(string id)
    {
        var pago = await _pagoService.GetByIdAsync(id);
        if (pago is null)
        {
            return NotFound(new { message = $"Pago con ID {id} no encontrado" });
        }
        return Ok(pago);
    }

    /// <summary>
    /// Obtiene pagos por pedido
    /// </summary>
    [HttpGet("pedido/{pedidoId}")]
    [ProducesResponseType(typeof(IEnumerable<PagoDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PagoDto>>> GetByPedido(string pedidoId)
    {
        var pagos = await _pagoService.GetByPedidoIdAsync(pedidoId);
        return Ok(pagos);
    }

    /// <summary>
    /// Obtiene pagos por usuario
    /// </summary>
    [HttpGet("usuario/{usuarioId}")]
    [ProducesResponseType(typeof(IEnumerable<PagoDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PagoDto>>> GetByUsuario(string usuarioId)
    {
        var pagos = await _pagoService.GetByUsuarioIdAsync(usuarioId);
        return Ok(pagos);
    }

    /// <summary>
    /// Crea un nuevo pago
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(PagoDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagoDto>> Create([FromBody] CreatePagoDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var pago = await _pagoService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = pago.Id }, pago);
    }

    /// <summary>
    /// Actualiza un pago existente
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(string id, [FromBody] UpdatePagoDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _pagoService.UpdateAsync(id, dto);
        if (!result)
        {
            return NotFound(new { message = $"Pago con ID {id} no encontrado" });
        }
        return NoContent();
    }

    /// <summary>
    /// Elimina un pago
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        var result = await _pagoService.DeleteAsync(id);
        if (!result)
        {
            return NotFound(new { message = $"Pago con ID {id} no encontrado" });
        }
        return NoContent();
    }
}
