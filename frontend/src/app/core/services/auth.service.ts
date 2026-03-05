import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { 
  AuthUser, 
  LoginCredentials, 
  Usuario, 
  ApiResponse, 
  AuthResponse, 
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
  UsuarioAuth
} from '../models/models';
import { environment } from '@env/environment';
import { firstValueFrom, catchError, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private usuariosApiUrl = environment.usuariosApiUrl;
  
  private currentUser = signal<AuthUser | null>(null);
  private currentUsuario = signal<UsuarioAuth | null>(null);
  private tokenExpirationTimer: ReturnType<typeof setTimeout> | null = null;
  
  isAuthenticated = computed(() => this.currentUser() !== null && !this.isTokenExpired());
  userRole = computed(() => {
    const rol = this.currentUsuario()?.rol?.toLowerCase();
    return (rol === 'admin' || rol === 'administrador') ? 'admin' : 'usuario';
  });
  username = computed(() => this.currentUsuario()?.nombre ?? null);
  usuarioActual = computed(() => this.currentUsuario());
  usuarioId = computed(() => this.currentUsuario()?.id ?? null);
  token = computed(() => this.currentUser()?.token ?? null);

  constructor() {
    this.loadFromStorage();
    this.setupTokenRefresh();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('auth_user');
    const storedUsuario = localStorage.getItem('current_usuario');
    if (stored) {
      try {
        const user = JSON.parse(stored) as AuthUser;
        // Verificar si el token no ha expirado
        if (new Date(user.expiration) > new Date()) {
          this.currentUser.set(user);
          if (storedUsuario) {
            const usuario = JSON.parse(storedUsuario) as UsuarioAuth;
            this.currentUsuario.set(usuario);
          }
        } else {
          // Token expirado, intentar refresh
          this.tryRefreshToken(user);
        }
      } catch {
        this.clearStorage();
      }
    }
  }

  private clearStorage(): void {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('current_usuario');
    this.currentUser.set(null);
    this.currentUsuario.set(null);
  }

  private isTokenExpired(): boolean {
    const user = this.currentUser();
    if (!user) return true;
    return new Date(user.expiration) <= new Date();
  }

  private setupTokenRefresh(): void {
    const user = this.currentUser();
    if (!user) return;

    const expirationTime = new Date(user.expiration).getTime();
    const now = Date.now();
    // Refrescar 5 minutos antes de que expire
    const refreshTime = expirationTime - now - (5 * 60 * 1000);

    if (refreshTime > 0) {
      this.tokenExpirationTimer = setTimeout(() => {
        this.tryRefreshToken(user);
      }, refreshTime);
    }
  }

  private async tryRefreshToken(user: AuthUser): Promise<void> {
    try {
      const request: RefreshTokenRequest = {
        token: user.token,
        refreshToken: user.refreshToken
      };
      
      const response = await firstValueFrom(
        this.http.post<ApiResponse<AuthResponse>>(`${this.usuariosApiUrl}/auth/refresh`, request)
      );

      if (response.success && response.data) {
        this.handleAuthSuccess(response.data);
      } else {
        this.logout();
      }
    } catch {
      this.logout();
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string }> {
    try {
      const loginRequest: LoginRequest = {
        email: credentials.username,
        password: credentials.password
      };

      const response = await firstValueFrom(
        this.http.post<ApiResponse<AuthResponse>>(`${this.usuariosApiUrl}/auth/login`, loginRequest).pipe(
          catchError((error: HttpErrorResponse) => {
            console.error('Error en login:', error);
            const message = error.error?.message || 'Error al conectar con el servidor';
            return of({ success: false, message, data: null, errors: null, timestamp: new Date().toISOString() } as ApiResponse<AuthResponse>);
          })
        )
      );

      if (response.success && response.data) {
        this.handleAuthSuccess(response.data);
        return { success: true, message: 'Login exitoso' };
      }

      return { success: false, message: response.message || 'Credenciales inválidas' };
    } catch (error) {
      console.error('Error durante login:', error);
      return { success: false, message: 'Error al conectar con el servidor. Verifica que las APIs estén corriendo.' };
    }
  }

  async register(data: RegisterRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<AuthResponse>>(`${this.usuariosApiUrl}/auth/register`, data).pipe(
          catchError((error: HttpErrorResponse) => {
            console.error('Error en registro:', error);
            const message = error.error?.message || 'Error al registrar usuario';
            return of({ success: false, message, data: null, errors: null, timestamp: new Date().toISOString() } as ApiResponse<AuthResponse>);
          })
        )
      );

      if (response.success && response.data) {
        this.handleAuthSuccess(response.data);
        return { success: true, message: 'Registro exitoso' };
      }

      return { success: false, message: response.message || 'Error al registrar usuario' };
    } catch (error) {
      console.error('Error durante registro:', error);
      return { success: false, message: 'Error al conectar con el servidor.' };
    }
  }

  async changePassword(data: ChangePasswordRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<null>>(`${this.usuariosApiUrl}/auth/change-password`, data, {
          headers: this.getAuthHeaders()
        }).pipe(
          catchError((error: HttpErrorResponse) => {
            const message = error.error?.message || 'Error al cambiar contraseña';
            return of({ success: false, message, data: null, errors: null, timestamp: new Date().toISOString() } as ApiResponse<null>);
          })
        )
      );

      if (response.success) {
        // Forzar re-login después de cambiar contraseña
        this.logout();
        return { success: true, message: 'Contraseña cambiada exitosamente. Por favor inicie sesión nuevamente.' };
      }

      return { success: false, message: response.message || 'Error al cambiar contraseña' };
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      return { success: false, message: 'Error al conectar con el servidor.' };
    }
  }

  private handleAuthSuccess(authResponse: AuthResponse): void {
    const authUser: AuthUser = {
      username: authResponse.usuario.nombre,
      role: authResponse.usuario.rol.toLowerCase() === 'admin' ? 'admin' : 'usuario',
      token: authResponse.token,
      refreshToken: authResponse.refreshToken,
      expiration: new Date(authResponse.expiration)
    };

    this.currentUser.set(authUser);
    this.currentUsuario.set(authResponse.usuario);
    localStorage.setItem('auth_user', JSON.stringify(authUser));
    localStorage.setItem('current_usuario', JSON.stringify(authResponse.usuario));
    
    this.setupTokenRefresh();
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.token();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  async logout(): Promise<void> {
    try {
      // Intentar hacer logout en el servidor
      if (this.token()) {
        await firstValueFrom(
          this.http.post<ApiResponse<null>>(`${this.usuariosApiUrl}/auth/logout`, {}, {
            headers: this.getAuthHeaders()
          }).pipe(
            catchError(() => of(null))
          )
        );
      }
    } catch {
      // Ignorar errores de logout
    } finally {
      if (this.tokenExpirationTimer) {
        clearTimeout(this.tokenExpirationTimer);
        this.tokenExpirationTimer = null;
      }
      this.clearStorage();
      this.router.navigate(['/login']);
    }
  }

  hasRole(roles: string[]): boolean {
    const role = this.userRole();
    return role !== null && roles.includes(role);
  }

  async refreshToken(): Promise<boolean> {
    const user = this.currentUser();
    if (!user) return false;

    try {
      await this.tryRefreshToken(user);
      return true;
    } catch {
      return false;
    }
  }

  async getProfile(): Promise<UsuarioAuth | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<UsuarioAuth>>(`${this.usuariosApiUrl}/auth/me`, {
          headers: this.getAuthHeaders()
        })
      );
      
      if (response.success && response.data) {
        this.currentUsuario.set(response.data);
        localStorage.setItem('current_usuario', JSON.stringify(response.data));
        return response.data;
      }
      return null;
    } catch {
      return null;
    }
  }
}
