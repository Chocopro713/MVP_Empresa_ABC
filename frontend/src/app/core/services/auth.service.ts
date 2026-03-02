import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthUser, LoginCredentials, Usuario, ApiResponse } from '../models/models';
import { environment } from '@env/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private usuariosApiUrl = environment.usuariosApiUrl;
  
  private currentUser = signal<AuthUser | null>(null);
  private currentUsuario = signal<Usuario | null>(null);
  
  isAuthenticated = computed(() => this.currentUser() !== null);
  userRole = computed(() => this.currentUser()?.role ?? null);
  username = computed(() => this.currentUser()?.username ?? null);
  usuarioActual = computed(() => this.currentUsuario());
  usuarioId = computed(() => this.currentUsuario()?.id ?? null);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('auth_user');
    const storedUsuario = localStorage.getItem('current_usuario');
    if (stored) {
      try {
        const user = JSON.parse(stored) as AuthUser;
        this.currentUser.set(user);
        if (storedUsuario) {
          const usuario = JSON.parse(storedUsuario) as Usuario;
          this.currentUsuario.set(usuario);
        }
      } catch {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('current_usuario');
      }
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string }> {
    try {
      // Buscar usuario por email en la API real
      const response = await firstValueFrom(
        this.http.get<ApiResponse<Usuario[]>>(`${this.usuariosApiUrl}/usuarios`)
      );
      
      const usuarios = response.data || [];
      
      // Buscar por email o nombre de usuario
      const usuario = usuarios.find((u: Usuario) => 
        u.email.toLowerCase() === credentials.username.toLowerCase() ||
        u.nombre.toLowerCase() === credentials.username.toLowerCase()
      );
      
      if (!usuario) {
        return { success: false, message: 'Usuario no encontrado en la base de datos' };
      }

      // Para demo, aceptamos cualquier contraseña no vacía
      // En producción, deberías tener un sistema de autenticación real
      if (!credentials.password || credentials.password.length < 3) {
        return { success: false, message: 'Contraseña inválida (mínimo 3 caracteres)' };
      }

      if (!usuario.activo) {
        return { success: false, message: 'Usuario inactivo. Contacte al administrador.' };
      }

      // Determinar rol basado en el campo rol del usuario
      const role: 'admin' | 'usuario' = 
        usuario.rol.toLowerCase() === 'admin' ? 'admin' : 'usuario';

      const authUser: AuthUser = {
        username: usuario.nombre,
        role: role,
        token: this.generateToken()
      };

      this.currentUser.set(authUser);
      this.currentUsuario.set(usuario);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      localStorage.setItem('current_usuario', JSON.stringify(usuario));
      
      return { success: true, message: 'Login exitoso' };
    } catch (error) {
      console.error('Error durante login:', error);
      return { success: false, message: 'Error al conectar con el servidor. Verifica que las APIs estén corriendo.' };
    }
  }

  logout(): void {
    this.currentUser.set(null);
    this.currentUsuario.set(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('current_usuario');
    this.router.navigate(['/login']);
  }

  hasRole(roles: string[]): boolean {
    const role = this.userRole();
    return role !== null && roles.includes(role);
  }

  private generateToken(): string {
    return 'token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
