using System.Text;
using AspNetCoreRateLimit;
using Gateway.API.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Polly;
using Polly.Extensions.Http;
using Serilog;

// Configurar Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(new ConfigurationBuilder()
        .AddJsonFile("appsettings.json")
        .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true)
        .Build())
    .CreateLogger();

try
{
    Log.Information("Iniciando API Gateway...");
    
    var builder = WebApplication.CreateBuilder(args);
    
    // Agregar configuración Docker si existe
    builder.Configuration.AddJsonFile("appsettings.Docker.json", optional: true);
    
    // Usar Serilog
    builder.Host.UseSerilog();

    // ============================================
    // SERVICIOS
    // ============================================

    // Rate Limiting
    builder.Services.AddMemoryCache();
    builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
    builder.Services.Configure<IpRateLimitPolicies>(builder.Configuration.GetSection("IpRateLimitPolicies"));
    builder.Services.AddInMemoryRateLimiting();
    builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

    // Autenticación JWT
    var jwtSettings = builder.Configuration.GetSection("Jwt");
    var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey no configurada");
    
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                ClockSkew = TimeSpan.Zero
            };

            options.Events = new JwtBearerEvents
            {
                OnAuthenticationFailed = context =>
                {
                    Log.Warning("Autenticación fallida: {Error}", context.Exception.Message);
                    return Task.CompletedTask;
                },
                OnTokenValidated = context =>
                {
                    var userId = context.Principal?.FindFirst("sub")?.Value;
                    Log.Debug("Token validado para usuario: {UserId}", userId);
                    return Task.CompletedTask;
                }
            };
        });

    // Políticas de autorización
    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy("authenticated", policy => policy.RequireAuthenticatedUser());
        options.AddPolicy("admin", policy => policy.RequireRole("Admin"));
    });

    // CORS centralizado
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:4200" };
    
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("GatewayPolicy", policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials()
                  .WithExposedHeaders("X-Correlation-Id", "X-RateLimit-Limit", "X-RateLimit-Remaining");
        });
    });

    // Configurar HttpClient con Polly para resiliencia
    builder.Services.AddHttpClient("GatewayClient")
        .AddPolicyHandler(GetRetryPolicy())
        .AddPolicyHandler(GetCircuitBreakerPolicy());

    // YARP Reverse Proxy
    builder.Services.AddReverseProxy()
        .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

    // Health Checks para microservicios
    var usuariosUrl = builder.Configuration["ReverseProxy:Clusters:usuarios-cluster:Destinations:usuarios-api:Address"] ?? "http://localhost:5001";
    var pedidosUrl = builder.Configuration["ReverseProxy:Clusters:pedidos-cluster:Destinations:pedidos-api:Address"] ?? "http://localhost:5002";
    var pagosUrl = builder.Configuration["ReverseProxy:Clusters:pagos-cluster:Destinations:pagos-api:Address"] ?? "http://localhost:5003";
    
    builder.Services.AddHealthChecks()
        .AddUrlGroup(new Uri($"{usuariosUrl}/health"), 
            name: "usuarios-api", 
            tags: ["microservice"])
        .AddUrlGroup(new Uri($"{pedidosUrl}/health"), 
            name: "pedidos-api", 
            tags: ["microservice"])
        .AddUrlGroup(new Uri($"{pagosUrl}/health"), 
            name: "pagos-api", 
            tags: ["microservice"]);

    var app = builder.Build();

    // ============================================
    // MIDDLEWARE PIPELINE
    // ============================================

    // Error Handling (primero en el pipeline)
    app.UseErrorHandling();

    // Logging de requests
    app.UseRequestLogging();

    // Rate Limiting
    app.UseIpRateLimiting();

    // CORS
    app.UseCors("GatewayPolicy");

    // Autenticación y Autorización
    app.UseAuthentication();
    app.UseAuthorization();

    // ============================================
    // ENDPOINTS
    // ============================================

    // Health check del gateway
    app.MapGet("/health", () => Results.Ok(new 
    { 
        status = "healthy",
        service = "api-gateway",
        timestamp = DateTime.UtcNow 
    })).WithTags("Health");

    // Health check agregado de todos los microservicios
    app.MapGet("/health/all", async (HttpContext context) =>
    {
        var healthCheckService = context.RequestServices.GetService<Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckService>();
        if (healthCheckService == null)
            return Results.Ok(new { status = "unknown" });

        var report = await healthCheckService.CheckHealthAsync();
        
        var response = new
        {
            status = report.Status.ToString(),
            timestamp = DateTime.UtcNow,
            services = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                duration = e.Value.Duration.TotalMilliseconds,
                error = e.Value.Exception?.Message
            })
        };

        return report.Status == Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Healthy 
            ? Results.Ok(response) 
            : Results.Json(response, statusCode: 503);
    }).WithTags("Health");

    // Información del gateway
    app.MapGet("/info", () => Results.Ok(new
    {
        name = "Nexos ABC API Gateway",
        version = "1.0.0",
        environment = app.Environment.EnvironmentName,
        timestamp = DateTime.UtcNow,
        endpoints = new
        {
            auth = "/api/auth/*",
            users = "/api/users/*",
            orders = "/api/orders/*",
            payments = "/api/payments/*",
            health = "/health",
            healthAll = "/health/all"
        }
    })).WithTags("Info");

    // YARP Reverse Proxy
    app.MapReverseProxy();

    Log.Information("API Gateway iniciado en puerto 5000");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "API Gateway terminó inesperadamente");
}
finally
{
    Log.CloseAndFlush();
}

// ============================================
// POLÍTICAS DE RESILIENCIA
// ============================================

static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy()
{
    return HttpPolicyExtensions
        .HandleTransientHttpError()
        .CircuitBreakerAsync(
            handledEventsAllowedBeforeBreaking: 5,
            durationOfBreak: TimeSpan.FromSeconds(30),
            onBreak: (outcome, breakDelay) =>
            {
                Log.Warning("Circuit breaker abierto por {BreakDelay}s debido a: {Error}", 
                    breakDelay.TotalSeconds, 
                    outcome.Exception?.Message ?? outcome.Result?.StatusCode.ToString());
            },
            onReset: () =>
            {
                Log.Information("Circuit breaker reseteado");
            },
            onHalfOpen: () =>
            {
                Log.Information("Circuit breaker en estado half-open");
            });
}

static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
{
    return HttpPolicyExtensions
        .HandleTransientHttpError()
        .WaitAndRetryAsync(
            retryCount: 3,
            sleepDurationProvider: retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
            onRetry: (outcome, timespan, retryAttempt, context) =>
            {
                Log.Warning("Reintento {RetryAttempt} después de {Delay}s debido a: {Error}",
                    retryAttempt,
                    timespan.TotalSeconds,
                    outcome.Exception?.Message ?? outcome.Result?.StatusCode.ToString());
            });
}
