using System.Diagnostics;
using System.Text;

namespace Gateway.API.Middleware;

/// <summary>
/// Middleware para logging de requests/responses con información detallada
/// </summary>
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.TraceIdentifier;
        var stopwatch = Stopwatch.StartNew();
        
        // Agregar correlation ID al response
        context.Response.Headers.TryAdd("X-Correlation-Id", correlationId);

        // Log del request entrante
        LogRequest(context, correlationId);

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            LogResponse(context, correlationId, stopwatch.ElapsedMilliseconds);
        }
    }

    private void LogRequest(HttpContext context, string correlationId)
    {
        var request = context.Request;
        var clientIp = GetClientIpAddress(context);
        
        _logger.LogInformation(
            "[{CorrelationId}] {Method} {Path}{QueryString} | IP: {ClientIP} | User-Agent: {UserAgent}",
            correlationId,
            request.Method,
            request.Path,
            request.QueryString,
            clientIp,
            request.Headers.UserAgent.ToString()
        );
    }

    private void LogResponse(HttpContext context, string correlationId, long elapsedMs)
    {
        var statusCode = context.Response.StatusCode;
        var logLevel = statusCode >= 500 ? LogLevel.Error :
                       statusCode >= 400 ? LogLevel.Warning :
                       LogLevel.Information;

        _logger.Log(
            logLevel,
            "[{CorrelationId}] Response: {StatusCode} | Duration: {ElapsedMs}ms",
            correlationId,
            statusCode,
            elapsedMs
        );
    }

    private static string GetClientIpAddress(HttpContext context)
    {
        // Verificar headers de proxy
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',')[0].Trim();
        }

        var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIp))
        {
            return realIp;
        }

        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}

/// <summary>
/// Extensión para registrar el middleware
/// </summary>
public static class RequestLoggingMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestLogging(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RequestLoggingMiddleware>();
    }
}
