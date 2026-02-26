using Microsoft.AspNetCore.Mvc;
using Pedidos.Application.DTOs;
using Pedidos.Application.Interfaces;

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
    [ProducesResponseType(typeof(IEnumerable<PedidoDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PedidoDto>>> GetAll()
    {
        var pedidos = await _pedidoService.GetAllAsync();
        return Ok(pedidos);
    }

    /// <summary>
    /// Obtiene un pedido por su ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(PedidoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PedidoDto>> GetById(string id)
    {
        var pedido = await _pedidoService.GetByIdAsync(id);
        if (pedido is null)
        {
            return NotFound(new { message = $"Pedido con ID {id} no encontrado" });
        }
        return Ok(pedido);
    }

    /// <summary>
    /// Obtiene pedidos por usuario
    /// </summary>
    [HttpGet("usuario/{usuarioId}")]
    [ProducesResponseType(typeof(IEnumerable<PedidoDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PedidoDto>>> GetByUsuario(string usuarioId)
    {
        var pedidos = await _pedidoService.GetByUsuarioIdAsync(usuarioId);
        return Ok(pedidos);
    }

    /// <summary>
    /// Crea un nuevo pedido
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(PedidoDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PedidoDto>> Create([FromBody] CreatePedidoDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var pedido = await _pedidoService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = pedido.Id }, pedido);
    }

    /// <summary>
    /// Actualiza un pedido existente
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(string id, [FromBody] UpdatePedidoDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _pedidoService.UpdateAsync(id, dto);
        if (!result)
        {
            return NotFound(new { message = $"Pedido con ID {id} no encontrado" });
        }
        return NoContent();
    }

    /// <summary>
    /// Elimina un pedido
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        var result = await _pedidoService.DeleteAsync(id);
        if (!result)
        {
            return NotFound(new { message = $"Pedido con ID {id} no encontrado" });
        }
        return NoContent();
    }
}
