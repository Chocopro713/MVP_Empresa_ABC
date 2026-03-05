# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copiar archivos de proyecto
COPY Gateway.API/Gateway.API.csproj Gateway.API/
RUN dotnet restore Gateway.API/Gateway.API.csproj

# Copiar código fuente
COPY . .
WORKDIR /src/Gateway.API
RUN dotnet build -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Instalar curl para health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copiar aplicación publicada
COPY --from=publish /app/publish .

# Configurar puerto
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production

# Crear directorio para logs
RUN mkdir -p /app/logs

EXPOSE 80

ENTRYPOINT ["dotnet", "Gateway.API.dll"]
