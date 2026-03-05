import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '@env/environment';
import { ApiResponse, Usuario, Pedido, Pago } from '../../core/models/models';
import { firstValueFrom } from 'rxjs';

interface DashboardStats {
  totalUsuarios: number;
  totalPedidos: number;
  totalPagos: number;
  pedidosPendientes: number;
  pedidosCompletados: number;
  montoTotalPagos: number;
  pagosAprobados: number;
  pagosPendientes: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatIconModule, 
    MatButtonModule, 
    MatProgressSpinnerModule,
    RouterLink
  ],
  template: `
    <div class="home-container">
      <div class="welcome-section">
        <h1>Bienvenido, {{ authService.username() | titlecase }}!</h1>
        <p class="subtitle">
          <mat-icon class="role-icon">{{ authService.userRole() === 'admin' ? 'admin_panel_settings' : 'person' }}</mat-icon>
          Rol: {{ authService.userRole() | titlecase }}
        </p>
      </div>
      
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando estadísticas...</p>
        </div>
      } @else {
        <div class="stats-grid">
          <!-- Usuarios (solo admin) -->
          @if (authService.userRole() === 'admin') {
            <mat-card class="stat-card">
              <mat-card-content>
                <mat-icon class="stat-icon users">people</mat-icon>
                <div class="stat-info">
                  <h3>Usuarios</h3>
                  <p class="stat-value">{{ stats().totalUsuarios }}</p>
                  <small>Registrados en el sistema</small>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button color="primary" routerLink="/dashboard/users">
                  Ver todos <mat-icon>arrow_forward</mat-icon>
                </button>
              </mat-card-actions>
            </mat-card>
          }
          
          <!-- Pedidos -->
          <mat-card class="stat-card">
            <mat-card-content>
              <mat-icon class="stat-icon orders">shopping_cart</mat-icon>
              <div class="stat-info">
                <h3>Pedidos</h3>
                <p class="stat-value">{{ stats().totalPedidos }}</p>
                <small>
                  <span class="status-badge pending">{{ stats().pedidosPendientes }} pendientes</span>
                  <span class="status-badge success">{{ stats().pedidosCompletados }} completados</span>
                </small>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button color="primary" routerLink="/dashboard/pedidos">
                Ver todos <mat-icon>arrow_forward</mat-icon>
              </button>
            </mat-card-actions>
          </mat-card>
          
          <!-- Pagos -->
          <mat-card class="stat-card">
            <mat-card-content>
              <mat-icon class="stat-icon payments">payments</mat-icon>
              <div class="stat-info">
                <h3>Pagos</h3>
                <p class="stat-value">{{ stats().totalPagos }}</p>
                <small>
                  <span class="status-badge success">{{ stats().pagosAprobados }} aprobados</span>
                  <span class="status-badge pending">{{ stats().pagosPendientes }} pendientes</span>
                </small>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button color="primary" routerLink="/dashboard/pagos">
                Ver todos <mat-icon>arrow_forward</mat-icon>
              </button>
            </mat-card-actions>
          </mat-card>
          
          <!-- Monto Total -->
          <mat-card class="stat-card revenue-card">
            <mat-card-content>
              <mat-icon class="stat-icon revenue">attach_money</mat-icon>
              <div class="stat-info">
                <h3>Ingresos Totales</h3>
                <p class="stat-value">{{ stats().montoTotalPagos | currency:'USD':'symbol':'1.2-2' }}</p>
                <small>De pagos aprobados</small>
              </div>
            </mat-card-content>
          </mat-card>
          
          @if (authService.userRole() === 'admin') {
            <mat-card class="stat-card admin-card">
              <mat-card-content>
                <mat-icon class="stat-icon admin">admin_panel_settings</mat-icon>
                <div class="stat-info">
                  <h3>Administración</h3>
                  <p class="stat-value">Admin</p>
                  <small>Acceso completo al sistema</small>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button color="accent" routerLink="/dashboard/admin">
                  Panel Admin <mat-icon>arrow_forward</mat-icon>
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
      
      @if (error()) {
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon>error_outline</mat-icon>
            <p>{{ error() }}</p>
            <button mat-button color="primary" (click)="loadStats()">Reintentar</button>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 1200px;
      margin: 0 auto;
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .welcome-section {
      margin-bottom: 32px;
      padding: 24px;
      background: var(--bg-card);
      border-radius: 16px;
      border: 1px solid var(--border-color);
    }
    
    .welcome-section h1 {
      font-size: 28px;
      margin-bottom: 8px;
      color: var(--text-primary);
      font-weight: 600;
    }
    
    .subtitle {
      font-size: 15px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .role-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--accent-blue);
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px;
      gap: 16px;
      color: var(--text-secondary);
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }
    
    .stat-card {
      transition: all 0.3s ease;
      border-radius: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
    }
    
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }
    
    .stat-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px;
    }
    
    .stat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      padding: 16px;
      border-radius: 14px;
    }
    
    .stat-icon.users {
      background: rgba(25, 118, 210, 0.12);
      color: #1976d2;
    }
    
    .stat-icon.orders {
      background: rgba(245, 124, 0, 0.12);
      color: #f57c00;
    }
    
    .stat-icon.payments {
      background: rgba(56, 142, 60, 0.12);
      color: #388e3c;
    }
    
    .stat-icon.revenue {
      background: rgba(123, 31, 162, 0.12);
      color: #7b1fa2;
    }
    
    .stat-icon.admin {
      background: rgba(194, 24, 91, 0.12);
      color: #c2185b;
    }
    
    .stat-info h3 {
      margin: 0;
      font-size: 13px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      margin: 6px 0;
      color: var(--text-primary);
    }
    
    .stat-info small {
      color: var(--text-secondary);
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .status-badge {
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .status-badge.pending {
      background: rgba(255, 152, 0, 0.15);
      color: var(--accent-orange);
    }
    
    .status-badge.success {
      background: rgba(76, 175, 80, 0.15);
      color: var(--accent-green);
    }
    
    .admin-card {
      border: 2px solid #c2185b;
    }
    
    .revenue-card {
      border: 2px solid #7b1fa2;
    }
    
    .activity-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .activity-card mat-card-subtitle {
      color: rgba(255,255,255,0.8);
    }
    
    .activity-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      padding: 16px 0;
    }
    
    .activity-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
    }
    
    .activity-item mat-icon {
      color: #4caf50;
    }
    
    .activity-card mat-card-actions button {
      color: white;
    }
    
    .error-card {
      background: rgba(244, 67, 54, 0.1);
      border: 1px solid var(--accent-red);
      margin-top: 16px;
      border-radius: 12px;
    }
    
    .error-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }
    
    .error-card mat-icon {
      color: var(--accent-red);
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    
    .error-card p {
      color: var(--text-primary);
      flex: 1;
    }
    
    @media (max-width: 768px) {
      .welcome-section h1 {
        font-size: 22px;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  authService = inject(AuthService);
  private http = inject(HttpClient);
  
  isLoading = signal(true);
  error = signal<string | null>(null);
  stats = signal<DashboardStats>({
    totalUsuarios: 0,
    totalPedidos: 0,
    totalPagos: 0,
    pedidosPendientes: 0,
    pedidosCompletados: 0,
    montoTotalPagos: 0,
    pagosAprobados: 0,
    pagosPendientes: 0
  });
  
  ngOnInit(): void {
    this.loadStats();
  }
  
  async loadStats(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      // Cargar datos de las 3 APIs en paralelo
      const [usuariosRes, pedidosRes, pagosRes] = await Promise.all([
        firstValueFrom(this.http.get<ApiResponse<Usuario[]>>(`${environment.usuariosApiUrl}/usuarios`)).catch(() => null),
        firstValueFrom(this.http.get<ApiResponse<Pedido[]>>(`${environment.pedidosApiUrl}/pedidos`)).catch(() => null),
        firstValueFrom(this.http.get<ApiResponse<Pago[]>>(`${environment.pagosApiUrl}/pagos`)).catch(() => null)
      ]);
      
      const usuarios = usuariosRes?.data || [];
      const pedidos = pedidosRes?.data || [];
      const pagos = pagosRes?.data || [];
      
      // Calcular estadísticas
      const pedidosPendientes = pedidos.filter((p: Pedido) => 
        p.estado?.toLowerCase() === 'pendiente' || p.estado?.toLowerCase() === 'procesando'
      ).length;
      
      const pedidosCompletados = pedidos.filter((p: Pedido) => 
        p.estado?.toLowerCase() === 'entregado' || p.estado?.toLowerCase() === 'completado'
      ).length;
      
      const pagosAprobados = pagos.filter((p: Pago) => 
        p.estado?.toLowerCase() === 'aprobado' || p.estado?.toLowerCase() === 'completado'
      );
      
      const pagosPendientes = pagos.filter((p: Pago) => 
        p.estado?.toLowerCase() === 'pendiente'
      ).length;
      
      const montoTotalPagos = pagosAprobados.reduce((sum: number, p: Pago) => sum + (p.monto || 0), 0);
      
      this.stats.set({
        totalUsuarios: usuarios.length,
        totalPedidos: pedidos.length,
        totalPagos: pagos.length,
        pedidosPendientes,
        pedidosCompletados,
        montoTotalPagos,
        pagosAprobados: pagosAprobados.length,
        pagosPendientes
      });
      
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
      this.error.set('Error al cargar las estadísticas. Verifica que las APIs estén corriendo.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
