import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, RouterLink],
  template: `
    <div class="home-container">
      <div class="welcome-section">
        <h1>Bienvenido, {{ authService.username() | titlecase }}!</h1>
        <p class="subtitle">Rol: {{ authService.userRole() | titlecase }}</p>
      </div>
      
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <mat-icon class="stat-icon users">people</mat-icon>
            <div class="stat-info">
              <h3>Usuarios</h3>
              <p class="stat-value">10</p>
              <small>Disponibles en la API</small>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary" routerLink="/dashboard/users">
              Ver todos <mat-icon>arrow_forward</mat-icon>
            </button>
          </mat-card-actions>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <mat-icon class="stat-icon posts">article</mat-icon>
            <div class="stat-info">
              <h3>Publicaciones</h3>
              <p class="stat-value">100</p>
              <small>Disponibles en la API</small>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary" routerLink="/dashboard/posts">
              Ver todos <mat-icon>arrow_forward</mat-icon>
            </button>
          </mat-card-actions>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <mat-icon class="stat-icon todos">check_circle</mat-icon>
            <div class="stat-info">
              <h3>Tareas</h3>
              <p class="stat-value">200</p>
              <small>Disponibles en la API</small>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary" routerLink="/dashboard/todos">
              Ver todos <mat-icon>arrow_forward</mat-icon>
            </button>
          </mat-card-actions>
        </mat-card>
        
        @if (authService.userRole() === 'admin') {
          <mat-card class="stat-card admin-card">
            <mat-card-content>
              <mat-icon class="stat-icon admin">admin_panel_settings</mat-icon>
              <div class="stat-info">
                <h3>Administración</h3>
                <p class="stat-value">Admin</p>
                <small>Acceso completo</small>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button color="accent" routerLink="/dashboard/admin">
                Ir a Admin <mat-icon>arrow_forward</mat-icon>
              </button>
            </mat-card-actions>
          </mat-card>
        }
      </div>
      
      <mat-card class="info-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>info</mat-icon>
          <mat-card-title>Acerca del sistema</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>
            Este sistema consume datos de la API pública 
            <a href="https://jsonplaceholder.typicode.com" target="_blank">JSONPlaceholder</a>.
          </p>
          <p>
            @if (authService.userRole() === 'admin') {
              <strong>Como administrador</strong>, tienes acceso completo a todas las funcionalidades.
            } @else {
              <strong>Como usuario</strong>, tienes acceso limitado a los primeros 3 elementos de cada lista.
            }
          </p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .welcome-section {
      margin-bottom: 32px;
    }
    
    .welcome-section h1 {
      font-size: 32px;
      margin-bottom: 8px;
      color: #333;
    }
    
    .subtitle {
      font-size: 16px;
      color: #666;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }
    
    .stat-card {
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    .stat-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px;
    }
    
    .stat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      padding: 16px;
      border-radius: 12px;
    }
    
    .stat-icon.users {
      background: #e3f2fd;
      color: #1976d2;
    }
    
    .stat-icon.posts {
      background: #fce4ec;
      color: #c2185b;
    }
    
    .stat-icon.todos {
      background: #e8f5e9;
      color: #388e3c;
    }
    
    .stat-icon.admin {
      background: #fff3e0;
      color: #f57c00;
    }
    
    .stat-info h3 {
      margin: 0;
      font-size: 14px;
      color: #666;
    }
    
    .stat-value {
      font-size: 28px;
      font-weight: 500;
      margin: 4px 0;
    }
    
    .stat-info small {
      color: #999;
    }
    
    .admin-card {
      border: 2px solid #ff9800;
    }
    
    .info-card {
      background: #f5f5f5;
    }
    
    .info-card mat-card-content {
      padding-top: 16px;
    }
    
    .info-card a {
      color: #3f51b5;
    }
    
    :host-context(.dark-theme) {
      .welcome-section h1 {
        color: #fff;
      }
      
      .subtitle, .stat-info h3 {
        color: #aaa;
      }
      
      .info-card {
        background: #424242;
      }
    }
  `]
})
export class HomeComponent {
  authService = inject(AuthService);
}
