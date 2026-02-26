namespace Pagos.Domain.Entities;

public class Pago
{
    public string Id { get; set; } = string.Empty;
    public string PedidoId { get; set; } = string.Empty;
    public string UsuarioId { get; set; } = string.Empty;
    public string NumeroTransaccion { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public string Moneda { get; set; } = "USD";
    public string MetodoPago { get; set; } = string.Empty;
    public string Estado { get; set; } = "Pendiente";
    public string? ReferenciaPago { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaProcesamiento { get; set; }
}
