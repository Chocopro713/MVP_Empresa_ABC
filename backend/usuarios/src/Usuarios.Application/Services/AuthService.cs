using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Usuarios.Application.DTOs;
using Usuarios.Application.Interfaces;
using Usuarios.Application.Settings;
using Usuarios.Domain.Entities;
using Usuarios.Domain.Interfaces;

namespace Usuarios.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUsuarioRepository _repository;
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<AuthService> _logger;
    private const int MaxLoginAttempts = 5;
    private const int LockoutMinutes = 15;

    public AuthService(
        IUsuarioRepository repository, 
        IOptions<JwtSettings> jwtSettings,
        ILogger<AuthService> logger)
    {
        _repository = repository;
        _jwtSettings = jwtSettings.Value;
        _logger = logger;
    }

    public async Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginDto dto)
    {
        _logger.LogInformation("Intento de login para: {Email}", dto.Email);
        
        var usuario = await _repository.GetByEmailAsync(dto.Email);
        
        if (usuario is null)
        {
            _logger.LogWarning("Usuario no encontrado: {Email}", dto.Email);
            return ServiceResult<AuthResponseDto>.Fail("Credenciales inválidas");
        }

        // Verificar si la cuenta está bloqueada
        if (usuario.BloqueoHasta.HasValue && usuario.BloqueoHasta > DateTime.UtcNow)
        {
            var minutosRestantes = (int)(usuario.BloqueoHasta.Value - DateTime.UtcNow).TotalMinutes;
            _logger.LogWarning("Cuenta bloqueada: {Email}. Minutos restantes: {Minutos}", dto.Email, minutosRestantes);
            return ServiceResult<AuthResponseDto>.Fail(
                $"Cuenta bloqueada. Intente de nuevo en {minutosRestantes + 1} minutos");
        }

        // Verificar si la cuenta está activa
        if (!usuario.Activo)
        {
            _logger.LogWarning("Cuenta inactiva: {Email}", dto.Email);
            return ServiceResult<AuthResponseDto>.Fail("Cuenta desactivada. Contacte al administrador");
        }

        // Verificar contraseña
        if (string.IsNullOrEmpty(usuario.PasswordHash) || !VerifyPassword(dto.Password, usuario.PasswordHash))
        {
            usuario.IntentosLogin++;
            
            if (usuario.IntentosLogin >= MaxLoginAttempts)
            {
                usuario.BloqueoHasta = DateTime.UtcNow.AddMinutes(LockoutMinutes);
                _logger.LogWarning("Cuenta bloqueada por intentos fallidos: {Email}", dto.Email);
            }
            
            await _repository.UpdateAsync(usuario);
            
            var intentosRestantes = MaxLoginAttempts - usuario.IntentosLogin;
            if (intentosRestantes > 0)
            {
                return ServiceResult<AuthResponseDto>.Fail(
                    $"Credenciales inválidas. {intentosRestantes} intentos restantes");
            }
            
            return ServiceResult<AuthResponseDto>.Fail(
                $"Cuenta bloqueada por {LockoutMinutes} minutos debido a múltiples intentos fallidos");
        }

        // Login exitoso - resetear contadores
        usuario.IntentosLogin = 0;
        usuario.BloqueoHasta = null;
        usuario.UltimoAcceso = DateTime.UtcNow;
        
        // Generar tokens
        var token = GenerateJwtToken(usuario);
        var refreshToken = GenerateRefreshToken();
        
        usuario.RefreshToken = refreshToken;
        usuario.RefreshTokenExpiry = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays);
        
        await _repository.UpdateAsync(usuario);
        
        _logger.LogInformation("Login exitoso para: {Email}", dto.Email);
        
        return ServiceResult<AuthResponseDto>.Ok(new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            Expiration = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes),
            Usuario = MapToAuthDto(usuario)
        });
    }

    public async Task<ServiceResult<AuthResponseDto>> RegisterAsync(RegisterDto dto)
    {
        _logger.LogInformation("Registrando nuevo usuario: {Email}", dto.Email);
        
        // Validar email único
        var existingByEmail = await _repository.GetByEmailAsync(dto.Email);
        if (existingByEmail is not null)
        {
            return ServiceResult<AuthResponseDto>.Fail("El correo electrónico ya está registrado");
        }

        // Validar teléfono único
        var existingByTelefono = await _repository.GetByTelefonoAsync(dto.Telefono);
        if (existingByTelefono is not null)
        {
            return ServiceResult<AuthResponseDto>.Fail("El número de teléfono ya está registrado");
        }

        // Crear usuario
        var usuario = new Usuario
        {
            Nombre = dto.Nombre,
            Email = dto.Email,
            PasswordHash = HashPassword(dto.Password),
            Telefono = dto.Telefono,
            Direccion = dto.Direccion,
            Rol = "Usuario", // Por defecto
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };

        var createdUsuario = await _repository.CreateAsync(usuario);
        
        // Generar tokens
        var token = GenerateJwtToken(createdUsuario);
        var refreshToken = GenerateRefreshToken();
        
        createdUsuario.RefreshToken = refreshToken;
        createdUsuario.RefreshTokenExpiry = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays);
        createdUsuario.UltimoAcceso = DateTime.UtcNow;
        
        await _repository.UpdateAsync(createdUsuario);
        
        _logger.LogInformation("Usuario registrado exitosamente: {Email}, ID: {Id}", dto.Email, createdUsuario.Id);
        
        return ServiceResult<AuthResponseDto>.Ok(new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            Expiration = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes),
            Usuario = MapToAuthDto(createdUsuario)
        });
    }

    public async Task<ServiceResult<AuthResponseDto>> RefreshTokenAsync(RefreshTokenDto dto)
    {
        _logger.LogInformation("Refrescando token");
        
        // Validar el JWT actual (puede estar expirado, pero debe ser válido estructuralmente)
        var principal = GetPrincipalFromExpiredToken(dto.Token);
        if (principal is null)
        {
            return ServiceResult<AuthResponseDto>.Fail("Token inválido");
        }

        var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return ServiceResult<AuthResponseDto>.Fail("Token inválido");
        }

        var usuario = await _repository.GetByIdAsync(userId);
        if (usuario is null)
        {
            return ServiceResult<AuthResponseDto>.Fail("Usuario no encontrado");
        }

        // Validar refresh token
        if (usuario.RefreshToken != dto.RefreshToken || 
            usuario.RefreshTokenExpiry <= DateTime.UtcNow)
        {
            _logger.LogWarning("Refresh token inválido o expirado para usuario: {Id}", userId);
            return ServiceResult<AuthResponseDto>.Fail("Refresh token inválido o expirado");
        }

        // Generar nuevos tokens
        var newToken = GenerateJwtToken(usuario);
        var newRefreshToken = GenerateRefreshToken();
        
        usuario.RefreshToken = newRefreshToken;
        usuario.RefreshTokenExpiry = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays);
        usuario.UltimoAcceso = DateTime.UtcNow;
        
        await _repository.UpdateAsync(usuario);
        
        _logger.LogInformation("Token refrescado exitosamente para usuario: {Id}", userId);
        
        return ServiceResult<AuthResponseDto>.Ok(new AuthResponseDto
        {
            Token = newToken,
            RefreshToken = newRefreshToken,
            Expiration = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes),
            Usuario = MapToAuthDto(usuario)
        });
    }

    public async Task<ServiceResult> LogoutAsync(string userId)
    {
        _logger.LogInformation("Cerrando sesión para usuario: {Id}", userId);
        
        var usuario = await _repository.GetByIdAsync(userId);
        if (usuario is null)
        {
            return ServiceResult.Fail("Usuario no encontrado");
        }

        // Invalidar refresh token
        usuario.RefreshToken = null;
        usuario.RefreshTokenExpiry = null;
        
        await _repository.UpdateAsync(usuario);
        
        _logger.LogInformation("Sesión cerrada exitosamente para usuario: {Id}", userId);
        
        return ServiceResult.Ok();
    }

    public async Task<ServiceResult> ChangePasswordAsync(string userId, ChangePasswordDto dto)
    {
        _logger.LogInformation("Cambiando contraseña para usuario: {Id}", userId);
        
        var usuario = await _repository.GetByIdAsync(userId);
        if (usuario is null)
        {
            return ServiceResult.Fail("Usuario no encontrado");
        }

        // Verificar contraseña actual
        if (!VerifyPassword(dto.CurrentPassword, usuario.PasswordHash))
        {
            _logger.LogWarning("Contraseña actual incorrecta para usuario: {Id}", userId);
            return ServiceResult.Fail("La contraseña actual es incorrecta");
        }

        // Actualizar contraseña
        usuario.PasswordHash = HashPassword(dto.NewPassword);
        usuario.FechaActualizacion = DateTime.UtcNow;
        
        // Invalidar refresh token para forzar re-login
        usuario.RefreshToken = null;
        usuario.RefreshTokenExpiry = null;
        
        await _repository.UpdateAsync(usuario);
        
        _logger.LogInformation("Contraseña cambiada exitosamente para usuario: {Id}", userId);
        
        return ServiceResult.Ok();
    }

    public async Task<ServiceResult<UsuarioAuthDto>> ValidateTokenAsync(string token)
    {
        var principal = GetPrincipalFromToken(token);
        if (principal is null)
        {
            return ServiceResult<UsuarioAuthDto>.Fail("Token inválido");
        }

        var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return ServiceResult<UsuarioAuthDto>.Fail("Token inválido");
        }

        var usuario = await _repository.GetByIdAsync(userId);
        if (usuario is null || !usuario.Activo)
        {
            return ServiceResult<UsuarioAuthDto>.Fail("Usuario no encontrado o inactivo");
        }

        return ServiceResult<UsuarioAuthDto>.Ok(MapToAuthDto(usuario));
    }

    #region Private Methods

    private string GenerateJwtToken(Usuario usuario)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.Id),
            new(JwtRegisteredClaimNames.Email, usuario.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, usuario.Id),
            new(ClaimTypes.Name, usuario.Nombre),
            new(ClaimTypes.Email, usuario.Email),
            new(ClaimTypes.Role, usuario.Rol)
        };

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private ClaimsPrincipal? GetPrincipalFromToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidateIssuer = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey)),
            ValidateLifetime = true,
            ValidIssuer = _jwtSettings.Issuer,
            ValidAudience = _jwtSettings.Audience
        };

        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
            
            if (securityToken is not JwtSecurityToken jwtSecurityToken || 
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            return principal;
        }
        catch
        {
            return null;
        }
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidateIssuer = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey)),
            ValidateLifetime = false, // Permitir tokens expirados
            ValidIssuer = _jwtSettings.Issuer,
            ValidAudience = _jwtSettings.Audience
        };

        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
            
            if (securityToken is not JwtSecurityToken jwtSecurityToken || 
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            return principal;
        }
        catch
        {
            return null;
        }
    }

    private static string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(12));
    }

    private static bool VerifyPassword(string password, string hash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
        catch
        {
            return false;
        }
    }

    private static UsuarioAuthDto MapToAuthDto(Usuario usuario) => new()
    {
        Id = usuario.Id,
        Nombre = usuario.Nombre,
        Email = usuario.Email,
        Rol = usuario.Rol
    };

    #endregion
}
