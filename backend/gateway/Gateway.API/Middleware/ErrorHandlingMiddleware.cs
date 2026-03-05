using System.Net;
using System.Text.Json;

namespace Gateway.API.Middleware;

/// <summary>
/// Middleware para manejo centralizado de errores
/// </summary>
public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var correlationId = context.TraceIdentifier;

        _logger.LogError(
            exception,
            "[{CorrelationId}] Error no controlado: {Message}",
            correlationId,
            exception.Message
        );

        var response = context.Response;
        response.ContentType = "application/json";

        var (statusCode, message) = exception switch
        {
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "No autorizado"),
            KeyNotFoundException => (HttpStatusCode.NotFound, "Recurso no encontrado"),
            ArgumentException => (HttpStatusCode.BadRequest, exception.Message),
            TimeoutException => (HttpStatusCode.GatewayTimeout, "El servicio no respondió a tiempo"),
            HttpRequestException => (HttpStatusCode.BadGateway, "Error de comunicación con el servicio"),
            _ => (HttpStatusCode.InternalServerError, "Error interno del servidor")
        };

        response.StatusCode = (int)statusCode;

        var errorResponse = new
        {
            error = message,
            code = statusCode.ToString(),
            correlationId,
            timestamp = DateTime.UtcNow
        };

        await response.WriteAsync(JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }
}

/// <summary>
/// Extensión para registrar el middleware
/// </summary>
public static class ErrorHandlingMiddlewareExtensions
{
    public static IApplicationBuilder UseErrorHandling(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ErrorHandlingMiddleware>();
    }
}
