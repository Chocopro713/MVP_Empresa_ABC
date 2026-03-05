using System.ComponentModel.DataAnnotations;

namespace Usuarios.Application.DTOs;

public record LoginDto
{
    [Required(ErrorMessage = "El email es requerido")]
    [EmailAddress(ErrorMessage = "El formato del email no es válido")]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es requerida")]
    [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres")]
    public string Password { get; init; } = string.Empty;
}

public record RegisterDto
{
    [Required(ErrorMessage = "El nombre es requerido")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres")]
    public string Nombre { get; init; } = string.Empty;

    [Required(ErrorMessage = "El email es requerido")]
    [EmailAddress(ErrorMessage = "El formato del email no es válido")]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es requerida")]
    [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$", 
        ErrorMessage = "La contraseña debe contener al menos una mayúscula, una minúscula y un número")]
    public string Password { get; init; } = string.Empty;

    [Required(ErrorMessage = "El teléfono es requerido")]
    [Phone(ErrorMessage = "El formato del teléfono no es válido")]
    public string Telefono { get; init; } = string.Empty;

    [StringLength(200, ErrorMessage = "La dirección no puede exceder 200 caracteres")]
    public string Direccion { get; init; } = string.Empty;
}

public record AuthResponseDto
{
    public string Token { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
    public DateTime Expiration { get; init; }
    public UsuarioAuthDto Usuario { get; init; } = null!;
}

public record UsuarioAuthDto
{
    public string Id { get; init; } = string.Empty;
    public string Nombre { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Rol { get; init; } = string.Empty;
}

public record RefreshTokenDto
{
    [Required(ErrorMessage = "El token es requerido")]
    public string Token { get; init; } = string.Empty;

    [Required(ErrorMessage = "El refresh token es requerido")]
    public string RefreshToken { get; init; } = string.Empty;
}

public record ChangePasswordDto
{
    [Required(ErrorMessage = "La contraseña actual es requerida")]
    public string CurrentPassword { get; init; } = string.Empty;

    [Required(ErrorMessage = "La nueva contraseña es requerida")]
    [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$", 
        ErrorMessage = "La contraseña debe contener al menos una mayúscula, una minúscula y un número")]
    public string NewPassword { get; init; } = string.Empty;
}
