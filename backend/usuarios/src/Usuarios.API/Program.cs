using System.Reflection;
using Usuarios.Application.Interfaces;
using Usuarios.Application.Services;
using Usuarios.Domain.Interfaces;
using Usuarios.Infrastructure.Data;
using Usuarios.Infrastructure.Repositories;
using Usuarios.Infrastructure.Settings;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configurar Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .Enrich.WithThreadId()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();

// MongoDB Settings
builder.Services.Configure<MongoDbSettings>(options =>
{
    options.ConnectionString = builder.Configuration["MongoDB:ConnectionString"] 
        ?? "mongodb://localhost:27017";
    options.DatabaseName = builder.Configuration["MongoDB:DatabaseName"] 
        ?? "usuarios_db";
});

// Registrar servicios
builder.Services.AddSingleton<MongoDbContext>();
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<IUsuarioService, UsuarioService>();

// Controllers
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        // Suprimir la respuesta automática de validación para usar nuestro formato
        options.SuppressModelStateInvalidFilter = true;
    });

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "Usuarios API",
        Version = "v1",
        Description = "Microservicio de gestión de usuarios",
        Contact = new()
        {
            Name = "ABC Team",
            Email = "dev@abc.com"
        }
    });
    
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// Health Checks
builder.Services.AddHealthChecks()
    .AddMongoDb(
        mongodbConnectionString: builder.Configuration["MongoDB:ConnectionString"] ?? "mongodb://localhost:27017",
        name: "mongodb",
        timeout: TimeSpan.FromSeconds(3),
        tags: new[] { "db", "mongodb" });

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Middleware pipeline
app.UseSerilogRequestLogging();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Usuarios API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowAll");

app.UseRouting();

app.MapControllers();

app.MapHealthChecks("/health/live", new()
{
    Predicate = _ => false
});

Log.Information("Usuarios API iniciando en {Environment}", 
    app.Environment.EnvironmentName);

try
{
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Usuarios API terminó inesperadamente");
}
finally
{
    Log.CloseAndFlush();
}
