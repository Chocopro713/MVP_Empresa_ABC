using System.Reflection;
using Pagos.Application.Interfaces;
using Pagos.Application.Services;
using Pagos.Domain.Interfaces;
using Pagos.Infrastructure.Data;
using Pagos.Infrastructure.Repositories;
using Pagos.Infrastructure.Settings;
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
        ?? "pagos_db";
});

// Registrar servicios
builder.Services.AddSingleton<MongoDbContext>();
builder.Services.AddScoped<IPagoRepository, PagoRepository>();
builder.Services.AddScoped<IPagoService, PagoService>();

// Controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "Pagos API",
        Version = "v1",
        Description = "Microservicio de gestión de pagos",
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
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Pagos API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowAll");

app.UseRouting();

app.MapControllers();

app.MapHealthChecks("/health/live", new()
{
    Predicate = _ => false
});

Log.Information("Pagos API iniciando en {Environment}", 
    app.Environment.EnvironmentName);

try
{
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Pagos API terminó inesperadamente");
}
finally
{
    Log.CloseAndFlush();
}
