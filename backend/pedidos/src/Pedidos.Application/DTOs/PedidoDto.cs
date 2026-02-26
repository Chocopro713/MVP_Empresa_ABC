namespace Pedidos.Application.DTOs;

public record PedidoDto(
    string Id,
    string UsuarioId,
    string NumeroOrden,
    List<ItemPedidoDto> Items,
    decimal Total,
    string Estado,
    string DireccionEnvio,
    DateTime FechaCreacion
);

public record ItemPedidoDto(
    string ProductoId,
    string Nombre,
    int Cantidad,
    decimal PrecioUnitario,
    decimal Subtotal
);

public record CreatePedidoDto(
    string UsuarioId,
    List<CreateItemPedidoDto> Items,
    string DireccionEnvio
);

public record CreateItemPedidoDto(
    string ProductoId,
    string Nombre,
    int Cantidad,
    decimal PrecioUnitario
);

public record UpdatePedidoDto(
    string Estado,
    string DireccionEnvio
);
