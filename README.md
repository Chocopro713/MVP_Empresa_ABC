# 🚀 Sistema de Gestión de Pedidos - Microservicios

[![.NET](https://img.shields.io/badge/.NET-9.0-512BD4?style=flat-square&logo=dotnet)](https://dotnet.microsoft.com/)
[![Angular](https://img.shields.io/badge/Angular-19-DD0031?style=flat-square&logo=angular)](https://angular.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)

## 📋 Descripción

Sistema MVP de gestión de pedidos desarrollado con arquitectura de microservicios, diseñado para la empresa ABC como parte de su proceso de migración tecnológica. El proyecto demuestra buenas prácticas de desarrollo, arquitectura limpia y patrones de diseño empresariales.

## ✨ Características Principales

### Backend
- **Respuesta Estándar API**: Formato unificado `ApiResponse<T>` con success, message, data, errors y timestamp
- **Validaciones Robustas**: DataAnnotations en DTOs + validaciones de negocio en servicios
- **Unicidad de Datos**: Validación de email y teléfono únicos en usuarios
- **Búsqueda por Query String**: Filtrado en todos los endpoints GET
- **Health Checks**: Endpoints de salud para monitoreo

### Frontend
- **CRUD Completo**: Gestión de Usuarios, Pedidos y Pagos
- **Formularios Reactivos**: Validaciones en tiempo real con Angular Reactive Forms
- **Simulación de Pagos**: Flujo completo de pago de pedidos (PENDIENTE → PAGADO)
- **Búsqueda con Debounce**: Filtrado eficiente en todas las listas
- **Selección de Usuario en Pedidos**: Lista desplegable al crear pedidos
- **Tema Oscuro/Claro**: Toggle de modo de visualización
- **PWA Ready**: Manifest y configuración para Progressive Web App

## 🏗️ Arquitectura

```mermaid
graph TB
    subgraph Frontend
        A[Angular 19 SPA]
    end
    
    subgraph API Gateway Layer
        B[Nginx / Direct Access]
    end
    
    subgraph Microservices
        C[Usuarios API<br/>.NET 9]
        D[Pedidos API<br/>.NET 9]
        E[Pagos API<br/>.NET 9]
    end
    
    subgraph Data Layer
        F[(MongoDB<br/>Usuarios)]
        G[(MongoDB<br/>Pedidos)]
        H[(MongoDB<br/>Pagos)]
    end
    
    A --> B
    B --> C
    B --> D
    B --> E
    C --> F
    D --> G
    E --> H
    
    style A fill:#DD0031
    style C fill:#512BD4
    style D fill:#512BD4
    style E fill:#512BD4
    style F fill:#47A248
    style G fill:#47A248
    style H fill:#47A248
```

## 🎯 Justificación Técnica

### ¿Por qué Microservicios?

| Aspecto | Beneficio |
|---------|-----------|
| **Escalabilidad** | Cada servicio escala independientemente según demanda |
| **Despliegue** | CI/CD independiente por servicio |
| **Resiliencia** | Fallo aislado, el sistema continúa operando |
| **Tecnología** | Libertad de elegir stack por servicio |
| **Equipos** | Desarrollo paralelo sin dependencias |

### ¿Por qué Base de Datos por Servicio?

- **Acoplamiento Bajo**: Cada servicio es dueño de sus datos
- **Autonomía**: Cambios de esquema sin afectar otros servicios
- **Optimización**: Modelo de datos específico por dominio
- **Consistencia**: Patrón Database per Service

### ¿Por qué REST?

- **Simplicidad**: Protocolo HTTP estándar
- **Interoperabilidad**: Compatible con cualquier cliente
- **Cacheabilidad**: HTTP caching nativo
- **Documentación**: OpenAPI/Swagger automático

### ¿Por qué Clean Architecture?

```
┌─────────────────────────────────────┐
│           Presentation              │  ← Controllers, DTOs
├─────────────────────────────────────┤
│           Application               │  ← Use Cases, Services
├─────────────────────────────────────┤
│             Domain                  │  ← Entities, Interfaces
├─────────────────────────────────────┤
│          Infrastructure             │  ← MongoDB, External APIs
└─────────────────────────────────────┘
```

- **Independencia**: El dominio no conoce detalles externos
- **Testabilidad**: Capas desacopladas, fácil testing
- **Mantenibilidad**: Cambios localizados por capa
- **Flexibilidad**: Cambiar infraestructura sin tocar negocio

## 📁 Estructura del Repositorio

```
/
├── frontend/                    # Angular 19 SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/           # Guards, Interceptors, Services
│   │   │   ├── features/       # Módulos por funcionalidad
│   │   │   ├── shared/         # Componentes compartidos
│   │   │   └── layout/         # Layout principal
│   │   └── environments/
│   └── Dockerfile
│
├── backend/
│   ├── usuarios/               # Microservicio de Usuarios
│   │   ├── src/
│   │   │   ├── Usuarios.Domain/
│   │   │   ├── Usuarios.Application/
│   │   │   ├── Usuarios.Infrastructure/
│   │   │   └── Usuarios.API/
│   │   └── Dockerfile
│   │
│   ├── pedidos/                # Microservicio de Pedidos
│   │   ├── src/
│   │   │   ├── Pedidos.Domain/
│   │   │   ├── Pedidos.Application/
│   │   │   ├── Pedidos.Infrastructure/
│   │   │   └── Pedidos.API/
│   │   └── Dockerfile
│   │
│   └── pagos/                  # Microservicio de Pagos
│       ├── src/
│       │   ├── Pagos.Domain/
│       │   ├── Pagos.Application/
│       │   ├── Pagos.Infrastructure/
│       │   └── Pagos.API/
│       └── Dockerfile
│
├── arquitectura/               # Documentación técnica
│   ├── DECISIONS.md
│   └── diagrams/
│
├── docker-compose.yml
└── README.md
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Docker Desktop 4.x+
- Docker Compose 2.x+

### Ejecutar con Docker

```bash
# Clonar el repositorio
git clone <repository-url>
cd NexosSoftware

# Construir y levantar todos los servicios
docker-compose up --build

# O en modo detached
docker-compose up --build -d
```

### URLs de Acceso

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:4200 | Angular SPA |
| **Usuarios API** | http://localhost:5001/swagger | Swagger UI |
| **Pedidos API** | http://localhost:5002/swagger | Swagger UI |
| **Pagos API** | http://localhost:5003/swagger | Swagger UI |

### Credenciales de Prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Admin (acceso completo) |
| usuario | user123 | Usuario (acceso limitado) |

### Health Checks

```bash
# Verificar estado de los servicios
curl http://localhost:5001/health
curl http://localhost:5002/health
curl http://localhost:5003/health
```

## 🔌 API Externa Integrada

El frontend consume datos de la API pública:

**JSONPlaceholder**: https://jsonplaceholder.typicode.com

- `/users` - Lista de usuarios
- `/posts` - Lista de publicaciones
- `/todos` - Lista de tareas

## 📸 Capturas de Pantalla

### Login
![Login Screen](./docs/screenshots/login.png)

### Dashboard Admin
![Dashboard Admin](./docs/screenshots/dashboard-admin.png)

### Dashboard Usuario
![Dashboard User](./docs/screenshots/dashboard-user.png)

### Modo Oscuro
![Dark Mode](./docs/screenshots/dark-mode.png)

## 🛠️ Comandos Útiles

```bash
# Usar el script de ayuda
./scripts/run.sh start    # Construir e iniciar servicios
./scripts/run.sh stop     # Detener servicios
./scripts/run.sh logs     # Ver logs
./scripts/run.sh status   # Estado de contenedores
./scripts/run.sh health   # Verificar health checks
./scripts/run.sh clean    # Limpiar todo

# O comandos Docker directos
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f usuarios-api

# Detener todos los servicios
docker-compose down

# Limpiar volúmenes (bases de datos)
docker-compose down -v

# Reconstruir un servicio específico
docker-compose up --build usuarios-api
```

## 📊 Endpoints por Servicio

### Usuarios API (Puerto 5001)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /status | Estado del servicio |
| GET | /api/usuarios | Listar usuarios (soporta `?search=`) |
| GET | /api/usuarios/{id} | Obtener usuario |
| POST | /api/usuarios | Crear usuario (valida unicidad email/teléfono) |
| PUT | /api/usuarios/{id} | Actualizar usuario |
| DELETE | /api/usuarios/{id} | Eliminar usuario |

### Pedidos API (Puerto 5002)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /status | Estado del servicio |
| GET | /api/pedidos | Listar pedidos (soporta `?search=`) |
| GET | /api/pedidos/{id} | Obtener pedido |
| GET | /api/pedidos/usuario/{usuarioId} | Pedidos por usuario |
| POST | /api/pedidos | Crear pedido |
| PUT | /api/pedidos/{id} | Actualizar pedido |
| DELETE | /api/pedidos/{id} | Eliminar pedido |

### Pagos API (Puerto 5003)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /status | Estado del servicio |
| GET | /api/pagos | Listar pagos (soporta `?search=`) |
| GET | /api/pagos/{id} | Obtener pago |
| GET | /api/pagos/pedido/{pedidoId} | Pagos por pedido |
| GET | /api/pagos/usuario/{usuarioId} | Pagos por usuario |
| POST | /api/pagos | Registrar pago |
| PUT | /api/pagos/{id} | Actualizar pago |
| DELETE | /api/pagos/{id} | Eliminar pago |

## 📦 Formato de Respuesta Estándar

Todas las APIs responden con el siguiente formato:

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... },
  "errors": [],
  "timestamp": "2026-03-02T12:00:00Z",
  "traceId": "abc123"
}
```

### Códigos de Estado HTTP

| Código | Descripción | Uso |
|--------|-------------|-----|
| 200 | OK | Operación exitosa |
| 201 | Created | Recurso creado |
| 400 | Bad Request | Datos inválidos / Error de validación |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Email o teléfono duplicado |
| 500 | Internal Error | Error del servidor |

## 🧪 Testing

```bash
# Ejecutar tests del backend
cd backend/usuarios && dotnet test
cd backend/pedidos && dotnet test
cd backend/pagos && dotnet test

# Ejecutar tests del frontend
cd frontend && npm test
```

## � Validaciones Implementadas

### Backend - Usuarios
| Campo | Validación |
|-------|------------|
| Nombre | Requerido, 2-100 caracteres |
| Email | Requerido, formato válido, único |
| Teléfono | Requerido, formato válido, único |
| Rol | Máximo 50 caracteres |

### Frontend - Formularios
- Validación en tiempo real con Reactive Forms
- Mensajes de error específicos por campo
- Indicadores visuales de campos inválidos
- Botón submit deshabilitado si hay errores

## 🎯 Flujo de Simulación de Pago

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant P as Pedidos API
    participant G as Pagos API
    
    U->>F: Click "Pagar Pedido"
    F->>F: Mostrar modal de pago
    U->>F: Seleccionar método y confirmar
    F->>G: POST /api/pagos
    G->>G: Crear registro de pago
    G-->>F: Pago creado
    F->>P: PUT /api/pedidos/{id}
    F->>P: Estado = "PAGADO"
    P-->>F: Pedido actualizado
    F-->>U: Confirmación visual
```

## �📝 Licencia

Este proyecto fue desarrollado como prueba técnica para la empresa ABC.

---

**Desarrollado con ❤️ usando .NET 9, Angular 19 y MongoDB**
