# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files and restore
COPY src/Usuarios.Domain/Usuarios.Domain.csproj src/Usuarios.Domain/
COPY src/Usuarios.Application/Usuarios.Application.csproj src/Usuarios.Application/
COPY src/Usuarios.Infrastructure/Usuarios.Infrastructure.csproj src/Usuarios.Infrastructure/
COPY src/Usuarios.API/Usuarios.API.csproj src/Usuarios.API/

RUN dotnet restore src/Usuarios.API/Usuarios.API.csproj

# Copy everything and build
COPY . .
RUN dotnet publish src/Usuarios.API/Usuarios.API.csproj -c Release -o /app/publish

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

ENTRYPOINT ["dotnet", "Usuarios.API.dll"]
