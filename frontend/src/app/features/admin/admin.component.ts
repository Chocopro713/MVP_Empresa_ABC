import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { catchError, of, timeout } from 'rxjs';

interface ServiceStatus {
  name: string;
  port: number;
  icon: string;
  iconClass: string;
  database: string;
  status: 'checking' | 'online' | 'offline' | 'unhealthy';
  healthUrl: string;
  swaggerUrl: string;
  healthDetails?: any;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatIconModule, 
    MatButtonModule, 
    MatTabsModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="admin-container">
      <div class="header">
        <mat-icon class="admin-icon">admin_panel_settings</mat-icon>
        <div>
          <h1>Panel de Administración</h1>
          <p class="subtitle">Acceso exclusivo para administradores</p>
        </div>
      </div>
      
      <mat-tab-group>
        <mat-tab label="Microservicios">
          <div class="tab-content">
            <div class="refresh-section">
              <button mat-raised-button color="primary" (click)="checkAllServices()">
                <mat-icon>refresh</mat-icon> Actualizar Estado
              </button>
            </div>
            <div class="services-grid">
              @for (service of services(); track service.name) {
                <mat-card class="service-card" [class.offline]="service.status === 'offline'">
                  <mat-card-header>
                    <mat-icon mat-card-avatar class="service-icon" [ngClass]="service.iconClass">
                      {{ service.icon }}
                    </mat-icon>
                    <mat-card-title>{{ service.name }}</mat-card-title>
                    <mat-card-subtitle>Puerto {{ service.port }}</mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="service-info">
                      @if (service.status === 'checking') {
                        <span class="status checking">
                          <mat-spinner diameter="16"></mat-spinner> Verificando...
                        </span>
                      } @else if (service.status === 'online') {
                        <span class="status online">● Online</span>
                      } @else if (service.status === 'unhealthy') {
                        <span class="status unhealthy">⚠ Degradado</span>
                      } @else {
                        <span class="status offline">✕ Offline</span>
                      }
                      <span>MongoDB: {{ service.database }}</span>
                      @if (service.healthDetails && service.status !== 'offline') {
                        <small class="health-details">
                          Última verificación: {{ getTimeAgo() }}
                        </small>
                      }
                    </div>
                  </mat-card-content>
                  <mat-card-actions>
                    <a mat-button color="primary" [href]="service.swaggerUrl" target="_blank"
                       [disabled]="service.status === 'offline'">
                      <mat-icon>api</mat-icon> Swagger
                    </a>
                    <a mat-button [href]="service.healthUrl" target="_blank"
                       [disabled]="service.status === 'offline'">
                      <mat-icon>favorite</mat-icon> Health
                    </a>
                  </mat-card-actions>
                </mat-card>
              }
            </div>
          </div>
        </mat-tab>
        
        <mat-tab label="Configuración">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Configuración del Sistema</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <table mat-table [dataSource]="configData" class="config-table">
                  <ng-container matColumnDef="key">
                    <th mat-header-cell *matHeaderCellDef>Clave</th>
                    <td mat-cell *matCellDef="let element">{{ element.key }}</td>
                  </ng-container>
                  <ng-container matColumnDef="value">
                    <th mat-header-cell *matHeaderCellDef>Valor</th>
                    <td mat-cell *matCellDef="let element">{{ element.value }}</td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="['key', 'value']"></tr>
                  <tr mat-row *matRowDef="let row; columns: ['key', 'value'];"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
        
        <mat-tab label="Logs">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Logs del Sistema</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="logs-container">
                  @for (log of logs(); track $index) {
                    <pre class="log-entry" [ngClass]="log.type">[{{ log.type | uppercase }}] {{ log.message }}</pre>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .admin-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .admin-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ff9800;
    }
    
    .header h1 {
      margin: 0;
    }
    
    .subtitle {
      margin: 4px 0 0 0;
      color: #666;
    }
    
    .tab-content {
      padding: 24px 0;
    }
    
    .refresh-section {
      margin-bottom: 16px;
    }
    
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .service-card {
      transition: transform 0.2s;
    }
    
    .service-card:hover {
      transform: translateY(-4px);
    }
    
    .service-card.offline {
      opacity: 0.7;
      border: 2px solid #f44336;
    }
    
    .service-icon {
      padding: 8px;
      border-radius: 8px;
    }
    
    .service-icon.usuarios {
      background: #e3f2fd;
      color: #1976d2;
    }
    
    .service-icon.pedidos {
      background: #e8f5e9;
      color: #388e3c;
    }
    
    .service-icon.pagos {
      background: #fff3e0;
      color: #f57c00;
    }
    
    .service-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .status {
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .status.online {
      color: #4caf50;
    }
    
    .status.checking {
      color: #2196f3;
    }
    
    .status.unhealthy {
      color: #ff9800;
    }
    
    .status.offline {
      color: #f44336;
    }
    
    .health-details {
      color: #999;
      font-size: 11px;
    }
    
    .config-table {
      width: 100%;
    }
    
    .logs-container {
      background: #1e1e1e;
      border-radius: 8px;
      padding: 16px;
      max-height: 400px;
      overflow: auto;
    }
    
    .log-entry {
      margin: 0 0 8px 0;
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }
    
    .log-entry.info {
      color: #4fc3f7;
    }
    
    .log-entry.warn {
      color: #ffb74d;
    }
    
    .log-entry.error {
      color: #ef5350;
    }
  `]
})
export class AdminComponent implements OnInit {
  private http = inject(HttpClient);
  authService = inject(AuthService);
  
  private lastCheck = new Date();
  
  services = signal<ServiceStatus[]>([
    {
      name: 'Usuarios API',
      port: 5001,
      icon: 'people',
      iconClass: 'usuarios',
      database: 'usuarios_db',
      status: 'checking',
      healthUrl: 'http://localhost:5001/health',
      swaggerUrl: 'http://localhost:5001/swagger'
    },
    {
      name: 'Pedidos API',
      port: 5002,
      icon: 'shopping_cart',
      iconClass: 'pedidos',
      database: 'pedidos_db',
      status: 'checking',
      healthUrl: 'http://localhost:5002/health',
      swaggerUrl: 'http://localhost:5002/swagger'
    },
    {
      name: 'Pagos API',
      port: 5003,
      icon: 'payment',
      iconClass: 'pagos',
      database: 'pagos_db',
      status: 'checking',
      healthUrl: 'http://localhost:5003/health',
      swaggerUrl: 'http://localhost:5003/swagger'
    }
  ]);
  
  logs = signal<{type: string; message: string}[]>([
    { type: 'info', message: 'Sistema iniciado correctamente' },
    { type: 'info', message: 'Verificando estado de microservicios...' }
  ]);
  
  configData = [
    { key: 'API_VERSION', value: 'v1' },
    { key: 'ENVIRONMENT', value: 'Development' },
    { key: 'DATABASE', value: 'MongoDB 7.0' },
    { key: 'FRAMEWORK_BACKEND', value: '.NET 9' },
    { key: 'FRAMEWORK_FRONTEND', value: 'Angular 19' },
    { key: 'AUTH_TYPE', value: 'Simulated' }
  ];
  
  ngOnInit(): void {
    this.checkAllServices();
  }
  
  checkAllServices(): void {
    this.lastCheck = new Date();
    const currentServices = this.services();
    
    // Reset all to checking
    this.services.set(currentServices.map(s => ({ ...s, status: 'checking' as const })));
    
    currentServices.forEach((service, index) => {
      this.checkServiceHealth(index);
    });
  }
  
  private checkServiceHealth(index: number): void {
    const service = this.services()[index];
    
    this.http.get<any>(`/api/${this.getServicePath(service.name)}`).pipe(
      timeout(5000),
      catchError(error => {
        // Si el error es de conexión, el servicio está offline
        if (error.status === 0 || error.name === 'TimeoutError') {
          return of({ error: 'offline' });
        }
        // Si hay respuesta pero con error (404, 500, etc), el servicio está unhealthy
        if (error.status >= 400) {
          return of({ error: 'unhealthy', status: error.status });
        }
        return of({ error: 'offline' });
      })
    ).subscribe(response => {
      const currentServices = [...this.services()];
      
      if (response && 'error' in response) {
        if (response.error === 'offline') {
          currentServices[index] = { ...currentServices[index], status: 'offline' };
          this.addLog('error', `${service.name} - Servicio OFFLINE (sin conexión)`);
        } else {
          currentServices[index] = { ...currentServices[index], status: 'unhealthy' };
          this.addLog('warn', `${service.name} - Servicio DEGRADADO (error ${response.status})`);
        }
      } else {
        currentServices[index] = { 
          ...currentServices[index], 
          status: 'online',
          healthDetails: response 
        };
        this.addLog('info', `${service.name} - Health check: OK`);
      }
      
      this.services.set(currentServices);
    });
  }
  
  private getServicePath(name: string): string {
    if (name.includes('Usuarios')) return 'usuarios';
    if (name.includes('Pedidos')) return 'pedidos';
    if (name.includes('Pagos')) return 'pagos';
    return '';
  }
  
  private addLog(type: string, message: string): void {
    const currentLogs = this.logs();
    this.logs.set([...currentLogs, { type, message }]);
  }
  
  getTimeAgo(): string {
    const seconds = Math.floor((new Date().getTime() - this.lastCheck.getTime()) / 1000);
    if (seconds < 60) return 'hace unos segundos';
    if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} minutos`;
    return `hace ${Math.floor(seconds / 3600)} horas`;
  }
}
