# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files and restore
COPY src/Pagos.Domain/Pagos.Domain.csproj src/Pagos.Domain/
COPY src/Pagos.Application/Pagos.Application.csproj src/Pagos.Application/
COPY src/Pagos.Infrastructure/Pagos.Infrastructure.csproj src/Pagos.Infrastructure/
COPY src/Pagos.API/Pagos.API.csproj src/Pagos.API/

RUN dotnet restore src/Pagos.API/Pagos.API.csproj

# Copy everything and build
COPY . .
RUN dotnet publish src/Pagos.API/Pagos.API.csproj -c Release -o /app/publish --no-restore

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

ENTRYPOINT ["dotnet", "Pagos.API.dll"]
