namespace Pagos.Application.DTOs;

public record PagoDto(
    string Id,
    string PedidoId,
    string UsuarioId,
    string NumeroTransaccion,
    decimal Monto,
    string Moneda,
    string MetodoPago,
    string Estado,
    string? ReferenciaPago,
    DateTime FechaCreacion,
    DateTime? FechaProcesamiento
);

public record CreatePagoDto(
    string PedidoId,
    string UsuarioId,
    decimal Monto,
    string Moneda = "USD",
    string MetodoPago = "Tarjeta"
);

public record UpdatePagoDto(
    string Estado,
    string? ReferenciaPago
);

public record ProcesarPagoDto(
    string NumeroTarjeta,
    string NombreTitular,
    string FechaExpiracion,
    string CVV
);
