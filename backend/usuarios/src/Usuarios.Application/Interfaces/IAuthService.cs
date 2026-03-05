using Usuarios.Application.DTOs;

namespace Usuarios.Application.Interfaces;

public interface IAuthService
{
    /// <summary>
    /// Autentica un usuario con email y contraseña
    /// </summary>
    Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginDto dto);
    
    /// <summary>
    /// Registra un nuevo usuario
    /// </summary>
    Task<ServiceResult<AuthResponseDto>> RegisterAsync(RegisterDto dto);
    
    /// <summary>
    /// Refresca el token de acceso usando el refresh token
    /// </summary>
    Task<ServiceResult<AuthResponseDto>> RefreshTokenAsync(RefreshTokenDto dto);
    
    /// <summary>
    /// Cierra la sesión del usuario (invalida el refresh token)
    /// </summary>
    Task<ServiceResult> LogoutAsync(string userId);
    
    /// <summary>
    /// Cambia la contraseña del usuario
    /// </summary>
    Task<ServiceResult> ChangePasswordAsync(string userId, ChangePasswordDto dto);
    
    /// <summary>
    /// Valida si un token es válido
    /// </summary>
    Task<ServiceResult<UsuarioAuthDto>> ValidateTokenAsync(string token);
}
