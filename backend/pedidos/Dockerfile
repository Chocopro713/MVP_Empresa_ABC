# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files and restore
COPY src/Pedidos.Domain/Pedidos.Domain.csproj src/Pedidos.Domain/
COPY src/Pedidos.Application/Pedidos.Application.csproj src/Pedidos.Application/
COPY src/Pedidos.Infrastructure/Pedidos.Infrastructure.csproj src/Pedidos.Infrastructure/
COPY src/Pedidos.API/Pedidos.API.csproj src/Pedidos.API/

RUN dotnet restore src/Pedidos.API/Pedidos.API.csproj

# Copy everything and build
COPY . .
RUN dotnet publish src/Pedidos.API/Pedidos.API.csproj -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
USER appuser

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

ENTRYPOINT ["dotnet", "Pedidos.API.dll"]
