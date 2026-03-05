export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  address?: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
  };
  phone?: string;
  website?: string;
  company?: {
    name: string;
  };
}

export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

export interface Todo {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
}

export interface AuthUser {
  username: string;
  role: 'admin' | 'usuario';
  token: string;
  refreshToken: string;
  expiration: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// ============ DTOs de Autenticación JWT ============

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
  direccion?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiration: string;
  usuario: UsuarioAuth;
}

export interface UsuarioAuth {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

export interface RefreshTokenRequest {
  token: string;
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ============ MODELOS PARA APIs REALES ============

// Usuario del microservicio
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  rol: string;
  activo: boolean;
  fechaCreacion: string;
}

export interface CreateUsuario {
  nombre: string;
  email: string;
  telefono: string;
  direccion?: string;
  rol?: string;
}

export interface UpdateUsuario {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  rol: string;
  activo: boolean;
}

// Pedido del microservicio
export interface Pedido {
  id: string;
  usuarioId: string;
  numeroOrden: string;
  items: ItemPedido[];
  total: number;
  estado: string;
  direccionEnvio: string;
  fechaCreacion: string;
  // Campos enriquecidos desde el frontend (no vienen del backend)
  usuarioNombre?: string;
  usuarioEmail?: string;
}

export interface ItemPedido {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface CreatePedido {
  usuarioId: string;
  items: CreateItemPedido[];
  direccionEnvio: string;
}

export interface CreateItemPedido {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface UpdatePedido {
  estado: string;
  direccionEnvio: string;
  nuevosItems?: CreateItemPedido[];
}

// Pago del microservicio
export interface Pago {
  id: string;
  pedidoId: string;
  usuarioId: string;
  numeroTransaccion: string;
  monto: number;
  moneda: string;
  metodoPago: string;
  estado: string;
  referenciaPago: string | null;
  fechaCreacion: string;
  fechaProcesamiento: string | null;
}

export interface CreatePago {
  pedidoId: string;
  usuarioId: string;
  monto: number;
  moneda?: string;
  metodoPago?: string;
}

export interface UpdatePago {
  estado: string;
  referenciaPago?: string;
}

// ============ RESPUESTAS ESTÁNDAR DE API ============

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[] | null;
  timestamp: string;
  traceId?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
