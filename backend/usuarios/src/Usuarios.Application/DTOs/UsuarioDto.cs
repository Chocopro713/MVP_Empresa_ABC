using System.ComponentModel.DataAnnotations;

namespace Usuarios.Application.DTOs;

public record UsuarioDto(
    string Id,
    string Nombre,
    string Email,
    string Telefono,
    string Direccion,
    string Rol,
    bool Activo,
    DateTime FechaCreacion
);

public record CreateUsuarioDto
{
    [Required(ErrorMessage = "El nombre es requerido")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres")]
    public string Nombre { get; init; } = string.Empty;

    [Required(ErrorMessage = "El correo electrónico es requerido")]
    [EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido")]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "El teléfono es requerido")]
    [Phone(ErrorMessage = "El formato del teléfono no es válido")]
    public string Telefono { get; init; } = string.Empty;

    [StringLength(200, ErrorMessage = "La dirección no puede exceder 200 caracteres")]
    public string Direccion { get; init; } = string.Empty;

    [StringLength(50, ErrorMessage = "El rol no puede exceder 50 caracteres")]
    public string Rol { get; init; } = "Usuario";
}

public record UpdateUsuarioDto
{
    [Required(ErrorMessage = "El nombre es requerido")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres")]
    public string Nombre { get; init; } = string.Empty;

    [Required(ErrorMessage = "El correo electrónico es requerido")]
    [EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido")]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "El teléfono es requerido")]
    [Phone(ErrorMessage = "El formato del teléfono no es válido")]
    public string Telefono { get; init; } = string.Empty;

    [StringLength(200, ErrorMessage = "La dirección no puede exceder 200 caracteres")]
    public string Direccion { get; init; } = string.Empty;

    [Required(ErrorMessage = "El rol es requerido")]
    [StringLength(50, ErrorMessage = "El rol no puede exceder 50 caracteres")]
    public string Rol { get; init; } = string.Empty;

    public bool Activo { get; init; } = true;
}
