# API Gateway - Nexos ABC

API Gateway centralizado implementado con **YARP (Yet Another Reverse Proxy)** para enrutar las peticiones a los microservicios de la aplicación.

## Características

- ✅ **Reverse Proxy** con YARP
- ✅ **Autenticación JWT** centralizada
- ✅ **Rate Limiting** basado en IP (100 peticiones/minuto, 1000/hora)
- ✅ **Circuit Breaker** con Polly (resiliencia)
- ✅ **Retry Policy** con backoff exponencial
- ✅ **Logging** centralizado con Serilog
- ✅ **Health Checks** agregados
- ✅ **CORS** centralizado
- ✅ **Error Handling** centralizado

## Rutas

### Autenticación
| Ruta Gateway | Microservicio | Descripción |
|-------------|---------------|-------------|
| `/api/auth/*` | usuarios-api | Login, registro, refresh token |

### Usuarios
| Ruta Gateway | Microservicio | Descripción |
|-------------|---------------|-------------|
| `/api/usuarios/*` | usuarios-api | CRUD de usuarios (español) |
| `/api/users/*` | usuarios-api | CRUD de usuarios (inglés) |

### Pedidos
| Ruta Gateway | Microservicio | Descripción |
|-------------|---------------|-------------|
| `/api/pedidos/*` | pedidos-api | CRUD de pedidos (español) |
| `/api/orders/*` | pedidos-api | CRUD de pedidos (inglés) |

### Pagos
| Ruta Gateway | Microservicio | Descripción |
|-------------|---------------|-------------|
| `/api/pagos/*` | pagos-api | CRUD de pagos (español) |
| `/api/payments/*` | pagos-api | CRUD de pagos (inglés) |

### Health Checks
| Ruta | Descripción |
|------|-------------|
| `/health` | Estado del gateway |
| `/health/all` | Estado agregado de todos los microservicios |
| `/health/usuarios` | Estado del servicio de usuarios |
| `/health/pedidos` | Estado del servicio de pedidos |
| `/health/pagos` | Estado del servicio de pagos |

### Información
| Ruta | Descripción |
|------|-------------|
| `/info` | Información del gateway |

## Configuración

### Puertos (Development)
- Gateway: `http://localhost:5000`
- Usuarios API: `http://localhost:5001`
- Pedidos API: `http://localhost:5002`
- Pagos API: `http://localhost:5003`

### Puertos (Docker)
- Gateway: `http://localhost:5000` → `api-gateway:80`
- Usuarios API: `usuarios-api:80`
- Pedidos API: `pedidos-api:80`
- Pagos API: `pagos-api:80`

## Rate Limiting

| Endpoint | Límite | Período |
|----------|--------|---------|
| General | 100 | 1 minuto |
| General | 1000 | 1 hora |
| `/api/auth/login` | 10 | 1 minuto |
| `/api/auth/register` | 5 | 1 hora |

## Resiliencia (Polly)

### Circuit Breaker
- **Errores antes de abrir**: 5
- **Duración del break**: 30 segundos

### Retry Policy
- **Intentos**: 3
- **Backoff**: Exponencial (2^attempt segundos)

## Ejecutar

### Desarrollo Local
```bash
cd backend/gateway/Gateway.API
dotnet run
```

### Docker
```bash
docker-compose up -d api-gateway
```

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `ASPNETCORE_ENVIRONMENT` | Ambiente de ejecución | Production |
| `Jwt__SecretKey` | Clave secreta JWT | (requerida) |
| `Jwt__Issuer` | Emisor del JWT | NexosABC.API |
| `Jwt__Audience` | Audiencia del JWT | NexosABC.Client |

## Logs

Los logs se guardan en:
- **Consola**: Formato estructurado
- **Archivo**: `logs/gateway-{date}.log` (rotación diaria, 7 días de retención)
