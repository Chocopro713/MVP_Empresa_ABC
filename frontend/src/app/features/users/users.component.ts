import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { UsuariosService } from '../../core/services/usuarios.service';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../core/models/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatChipsModule, MatButtonModule],
  template: `
    <div class="users-container">
      <div class="header">
        <h1>Usuarios</h1>
        <p class="subtitle">Datos desde MongoDB - API Usuarios (Puerto 5001)</p>
        @if (authService.userRole() !== 'admin') {
          <mat-chip-set>
            <mat-chip color="warn">Acceso limitado - Solo 3 usuarios</mat-chip>
          </mat-chip-set>
        }
      </div>
      
      @if (loading()) {
        <div class="loading">
          <mat-spinner></mat-spinner>
          <p>Cargando usuarios desde la base de datos...</p>
        </div>
      } @else if (error()) {
        <div class="error">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="loadUsers()">
            <mat-icon>refresh</mat-icon> Reintentar
          </button>
        </div>
      } @else {
        <div class="users-grid">
          @for (user of displayUsers(); track user.id) {
            <mat-card class="user-card">
              <mat-card-header>
                <div mat-card-avatar class="avatar" [class]="getRolClass(user.rol)">
                  {{ user.nombre.charAt(0) }}
                </div>
                <mat-card-title>{{ user.nombre }}</mat-card-title>
                <mat-card-subtitle>
                  <mat-chip [color]="user.activo ? 'primary' : 'warn'" selected>
                    {{ user.activo ? 'Activo' : 'Inactivo' }}
                  </mat-chip>
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="info-row">
                  <mat-icon>email</mat-icon>
                  <span>{{ user.email }}</span>
                </div>
                <div class="info-row">
                  <mat-icon>phone</mat-icon>
                  <span>{{ user.telefono }}</span>
                </div>
                <div class="info-row">
                  <mat-icon>badge</mat-icon>
                  <span>Rol: {{ user.rol }}</span>
                </div>
                <div class="info-row">
                  <mat-icon>calendar_today</mat-icon>
                  <span>Registrado: {{ formatDate(user.fechaCreacion) }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
        
        @if (displayUsers().length === 0) {
          <div class="no-data">
            <mat-icon>person_off</mat-icon>
            <p>No hay usuarios registrados</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .users-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      margin-bottom: 24px;
    }
    
    .header h1 {
      margin-bottom: 4px;
    }
    
    .subtitle {
      color: #666;
      margin-bottom: 12px;
    }
    
    .loading, .error, .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      gap: 16px;
    }
    
    .error mat-icon, .no-data mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #999;
    }
    
    .users-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    
    .user-card {
      transition: transform 0.2s;
    }
    
    .user-card:hover {
      transform: translateY(-4px);
    }
    
    .avatar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 500;
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
    
    .avatar.admin {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    
    .avatar.moderador {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
    
    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
      color: #666;
    }
    
    .info-row mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #999;
    }
  `]
})
export class UsersComponent implements OnInit {
  private usuariosService = inject(UsuariosService);
  authService = inject(AuthService);
  
  users = signal<Usuario[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  
  displayUsers = computed(() => {
    const allUsers = this.users();
    if (this.authService.userRole() === 'admin') {
      return allUsers;
    }
    return allUsers.slice(0, 3);
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.usuariosService.getAll().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.error.set('Error al cargar usuarios. Verifica que la API esté corriendo.');
        this.loading.set(false);
      }
    });
  }

  getRolClass(rol: string): string {
    return rol.toLowerCase();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
