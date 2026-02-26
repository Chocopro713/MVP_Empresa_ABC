namespace Usuarios.Application.DTOs;

public record UsuarioDto(
    string Id,
    string Nombre,
    string Email,
    string Telefono,
    string Rol,
    bool Activo,
    DateTime FechaCreacion
);

public record CreateUsuarioDto(
    string Nombre,
    string Email,
    string Telefono,
    string Rol = "Usuario"
);

public record UpdateUsuarioDto(
    string Nombre,
    string Email,
    string Telefono,
    string Rol,
    bool Activo
);
