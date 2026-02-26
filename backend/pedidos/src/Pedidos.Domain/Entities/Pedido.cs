namespace Pedidos.Domain.Entities;

public class Pedido
{
    public string Id { get; set; } = string.Empty;
    public string UsuarioId { get; set; } = string.Empty;
    public string NumeroOrden { get; set; } = string.Empty;
    public List<ItemPedido> Items { get; set; } = new();
    public decimal Total { get; set; }
    public string Estado { get; set; } = "Pendiente";
    public string DireccionEnvio { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaActualizacion { get; set; }
}

public class ItemPedido
{
    public string ProductoId { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal => Cantidad * PrecioUnitario;
}
