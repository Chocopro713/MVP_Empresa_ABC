import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '@env/environment';
import { ApiResponse, Usuario } from '../../core/models/models';
import { catchError, of, timeout, firstValueFrom } from 'rxjs';

interface ServiceStatus {
  name: string;
  port: number;
  icon: string;
  iconClass: string;
  database: string;
  status: 'checking' | 'online' | 'offline' | 'unhealthy';
  healthUrl: string;
  swaggerUrl: string;
  healthDetails?: unknown;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule, 
    MatIconModule, 
    MatButtonModule, 
    MatTabsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  template: `
    <div class="admin-container">
      <div class="header">
        <mat-icon class="admin-icon">admin_panel_settings</mat-icon>
        <div>
          <h1>Panel de Administración</h1>
          <p class="subtitle">Gestión completa del sistema</p>
        </div>
      </div>
      
      <mat-tab-group>
        <!-- TAB: Gestión de Usuarios -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">people</mat-icon>
            Usuarios
            @if (usuarios().length > 0) {
              <span class="badge">{{ usuarios().length }}</span>
            }
          </ng-template>
          <div class="tab-content">
            <div class="actions-bar">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Buscar usuarios</mat-label>
                <input matInput 
                       [ngModel]="searchTerm()" 
                       (ngModelChange)="searchTerm.set($event)"
                       placeholder="Nombre, email o teléfono...">
                <mat-icon matPrefix>search</mat-icon>
                @if (searchTerm()) {
                  <button matSuffix mat-icon-button (click)="searchTerm.set('')">
                    <mat-icon>close</mat-icon>
                  </button>
                }
              </mat-form-field>
              <button mat-raised-button color="primary" (click)="loadUsuarios()">
                <mat-icon>refresh</mat-icon> Actualizar
              </button>
            </div>
            
            @if (loadingUsuarios()) {
              <div class="loading">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Cargando usuarios...</p>
              </div>
            } @else {
              @if (filteredUsuarios().length === 0 && searchTerm()) {
                <div class="no-results">
                  <mat-icon>search_off</mat-icon>
                  <p>No se encontraron usuarios con "{{ searchTerm() }}"</p>
                  <button mat-stroked-button (click)="searchTerm.set('')">
                    Limpiar búsqueda
                  </button>
                </div>
              } @else {
                <div class="users-table-container">
                  <table mat-table [dataSource]="filteredUsuarios()" class="users-table">
                  <!-- Nombre -->
                  <ng-container matColumnDef="nombre">
                    <th mat-header-cell *matHeaderCellDef>Nombre</th>
                    <td mat-cell *matCellDef="let user">
                      <div class="user-cell">
                        <mat-icon class="user-avatar">account_circle</mat-icon>
                        <div>
                          <strong>{{ user.nombre }}</strong>
                          <small>{{ user.email }}</small>
                        </div>
                      </div>
                    </td>
                  </ng-container>
                  
                  <!-- Teléfono -->
                  <ng-container matColumnDef="telefono">
                    <th mat-header-cell *matHeaderCellDef>Teléfono</th>
                    <td mat-cell *matCellDef="let user">{{ user.telefono }}</td>
                  </ng-container>
                  
                  <!-- Rol -->
                  <ng-container matColumnDef="rol">
                    <th mat-header-cell *matHeaderCellDef>Rol</th>
                    <td mat-cell *matCellDef="let user">
                      <mat-form-field appearance="outline" class="role-select">
                        <mat-select [value]="user.rol" (selectionChange)="changeUserRole(user, $event.value)">
                          <mat-option value="Usuario">Usuario</mat-option>
                          <mat-option value="Administrador">Administrador</mat-option>
                        </mat-select>
                      </mat-form-field>
                    </td>
                  </ng-container>
                  
                  <!-- Estado -->
                  <ng-container matColumnDef="activo">
                    <th mat-header-cell *matHeaderCellDef>Estado</th>
                    <td mat-cell *matCellDef="let user">
                      <mat-slide-toggle 
                        [checked]="user.activo"
                        (change)="toggleUserStatus(user)"
                        [matTooltip]="user.activo ? 'Desactivar usuario' : 'Activar usuario'"
                        color="primary">
                        {{ user.activo ? 'Activo' : 'Inactivo' }}
                      </mat-slide-toggle>
                    </td>
                  </ng-container>
                  
                  <!-- Fecha -->
                  <ng-container matColumnDef="fecha">
                    <th mat-header-cell *matHeaderCellDef>Registrado</th>
                    <td mat-cell *matCellDef="let user">
                      {{ user.fechaCreacion | date:'dd/MM/yyyy' }}
                    </td>
                  </ng-container>
                  
                  <!-- Acciones -->
                  <ng-container matColumnDef="acciones">
                    <th mat-header-cell *matHeaderCellDef>Acciones</th>
                    <td mat-cell *matCellDef="let user">
                      <button mat-icon-button color="warn" 
                              matTooltip="Eliminar usuario"
                              (click)="deleteUser(user)"
                              [disabled]="user.email === authService.usuarioActual()?.email">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>
                  
                  <tr mat-header-row *matHeaderRowDef="userColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: userColumns;"
                      [class.inactive]="!row.activo"></tr>
                </table>
                </div>
              }
            }
          </div>
        </mat-tab>
        
        <!-- TAB: Microservicios -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">dns</mat-icon>
            Microservicios
          </ng-template>
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
                    </div>
                  </mat-card-content>
                  <mat-card-actions>
                    <a mat-button color="primary" [href]="service.swaggerUrl" target="_blank"
                       [class.disabled-link]="service.status === 'offline'">
                      <mat-icon>api</mat-icon> Swagger
                    </a>
                    <a mat-button [href]="service.healthUrl" target="_blank"
                       [class.disabled-link]="service.status === 'offline'">
                      <mat-icon>favorite</mat-icon> Health
                    </a>
                  </mat-card-actions>
                </mat-card>
              }
            </div>
          </div>
        </mat-tab>
        
        <!-- TAB: Configuración -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">settings</mat-icon>
            Configuración
          </ng-template>
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
                    <td mat-cell *matCellDef="let element">
                      <span [class.success-value]="element.key === 'AUTH_TYPE'">{{ element.value }}</span>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="['key', 'value']"></tr>
                  <tr mat-row *matRowDef="let row; columns: ['key', 'value'];"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
        
        <!-- TAB: Logs -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">terminal</mat-icon>
            Logs
          </ng-template>
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Logs del Sistema</mat-card-title>
                <button mat-icon-button (click)="clearLogs()" matTooltip="Limpiar logs">
                  <mat-icon>delete_sweep</mat-icon>
                </button>
              </mat-card-header>
              <mat-card-content>
                <div class="logs-container">
                  @for (log of logs(); track $index) {
                    <pre class="log-entry" [ngClass]="log.type">[{{ log.timestamp | date:'HH:mm:ss' }}] [{{ log.type | uppercase }}] {{ log.message }}</pre>
                  }
                  @if (logs().length === 0) {
                    <p class="no-logs">No hay logs disponibles</p>
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
      max-width: 1400px;
      margin: 0 auto;
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding: 20px 24px;
      background: var(--bg-card);
      border-radius: 16px;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
    }
    
    .admin-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--accent-orange);
    }
    
    .header h1 {
      margin: 0;
      color: var(--text-primary);
      font-size: 24px;
      font-weight: 600;
    }
    
    .subtitle {
      margin: 4px 0 0 0;
      color: var(--text-secondary);
      font-size: 14px;
    }
    
    /* Tab styling fix for dark mode */
    :host ::ng-deep .mat-mdc-tab-group {
      background: var(--bg-card);
      border-radius: 16px;
      border: 1px solid var(--border-color);
      overflow: hidden;
    }
    
    :host ::ng-deep .mat-mdc-tab-header {
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
    }
    
    :host ::ng-deep .mat-mdc-tab {
      color: var(--tab-text) !important;
      opacity: 1 !important;
      min-width: 140px;
      padding: 0 24px;
    }
    
    :host ::ng-deep .mat-mdc-tab .mdc-tab__text-label {
      color: var(--tab-text) !important;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    :host ::ng-deep .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label {
      color: var(--tab-text-active) !important;
    }
    
    :host ::ng-deep .mat-mdc-tab:hover {
      background: var(--tab-bg-hover);
    }
    
    :host ::ng-deep .mdc-tab-indicator__content--underline {
      border-color: var(--tab-indicator) !important;
      border-width: 3px !important;
    }
    
    .tab-icon {
      margin-right: 8px;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    
    .badge {
      background: var(--accent-blue);
      color: white;
      border-radius: 12px;
      padding: 2px 10px;
      font-size: 12px;
      margin-left: 8px;
      font-weight: 600;
    }
    
    .tab-content {
      padding: 24px;
      background: var(--bg-card);
    }
    
    .actions-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .search-field {
      flex: 1;
      min-width: 250px;
      max-width: 400px;
    }
    
    .search-field ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
    
    .search-field ::ng-deep .mat-mdc-text-field-wrapper {
      background: var(--bg-secondary);
      border-radius: 12px;
    }
    
    .search-field mat-icon[matPrefix] {
      color: var(--text-secondary);
      margin-right: 8px;
    }
    
    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      gap: 16px;
      color: var(--text-secondary);
      background: var(--bg-secondary);
      border-radius: 16px;
      border: 2px dashed var(--border-color);
    }
    
    .no-results mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      opacity: 0.5;
    }
    
    .no-results p {
      margin: 0;
      font-size: 16px;
    }
    
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px;
      gap: 16px;
      color: var(--text-secondary);
    }
    
    .users-table-container {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }
    
    .users-table {
      width: 100%;
      min-width: 800px;
    }
    
    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .user-cell div {
      display: flex;
      flex-direction: column;
    }
    
    .user-cell strong {
      color: var(--text-primary);
    }
    
    .user-cell small {
      color: var(--text-secondary);
      font-size: 12px;
    }
    
    .user-avatar {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--accent-blue);
    }
    
    .role-select {
      width: 140px;
    }
    
    .role-select ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
    
    tr.inactive {
      opacity: 0.5;
    }
    
    .refresh-section {
      margin-bottom: 20px;
    }
    
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    
    .service-card {
      transition: all 0.3s ease;
      border-radius: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
    }
    
    .service-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }
    
    .service-card.offline {
      opacity: 0.7;
      border: 2px solid var(--accent-red);
    }
    
    .service-icon {
      padding: 10px;
      border-radius: 12px;
    }
    
    .service-icon.usuarios {
      background: rgba(25, 118, 210, 0.15);
      color: #1976d2;
    }
    
    .service-icon.pedidos {
      background: rgba(56, 142, 60, 0.15);
      color: #388e3c;
    }
    
    .service-icon.pagos {
      background: rgba(245, 124, 0, 0.15);
      color: #f57c00;
    }
    
    :host ::ng-deep .mat-mdc-card-header {
      padding: 16px;
    }
    
    :host ::ng-deep .mat-mdc-card-title {
      color: var(--text-primary) !important;
      font-size: 16px;
      font-weight: 600;
    }
    
    :host ::ng-deep .mat-mdc-card-subtitle {
      color: var(--text-secondary) !important;
    }
    
    .service-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      color: var(--text-secondary);
    }
    
    .status {
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .status.online { color: var(--accent-green); }
    .status.checking { color: var(--accent-blue); }
    .status.unhealthy { color: var(--accent-orange); }
    .status.offline { color: var(--accent-red); }
    
    .disabled-link {
      pointer-events: none;
      opacity: 0.5;
    }
    
    .config-table {
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .success-value {
      color: var(--accent-green);
      font-weight: 600;
    }
    
    .logs-container {
      background: #0d1117;
      border-radius: 12px;
      padding: 20px;
      max-height: 400px;
      overflow: auto;
      border: 1px solid #30363d;
    }
    
    .log-entry {
      margin: 0 0 8px 0;
      font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
    }
    
    .log-entry.info { color: #58a6ff; }
    .log-entry.warn { color: #d29922; }
    .log-entry.error { color: #f85149; }
    .log-entry.success { color: #3fb950; }
    
    .no-logs {
      color: var(--text-secondary);
      text-align: center;
      padding: 40px;
      font-style: italic;
    }
    
    :host ::ng-deep mat-card-header {
      display: flex;
      align-items: center;
    }
    
    :host ::ng-deep mat-card-header button {
      margin-left: auto;
    }
    
    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        text-align: center;
      }
      
      .services-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminComponent implements OnInit {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  authService = inject(AuthService);
  
  usuarios = signal<Usuario[]>([]);
  loadingUsuarios = signal(false);
  searchTerm = signal('');
  userColumns = ['nombre', 'telefono', 'rol', 'activo', 'fecha', 'acciones'];
  
  // Computed para filtrar usuarios basado en el término de búsqueda
  filteredUsuarios = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.usuarios();
    return this.usuarios().filter(user => 
      user.nombre?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.telefono?.includes(term)
    );
  });
  
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
  
  logs = signal<{type: string; message: string; timestamp: Date}[]>([]);
  
  configData = [
    { key: 'API_VERSION', value: 'v1' },
    { key: 'ENVIRONMENT', value: 'Production' },
    { key: 'DATABASE', value: 'MongoDB 7.0' },
    { key: 'FRAMEWORK_BACKEND', value: '.NET 9' },
    { key: 'FRAMEWORK_FRONTEND', value: 'Angular 19' },
    { key: 'AUTH_TYPE', value: 'JWT Bearer' }
  ];
  
  ngOnInit(): void {
    this.addLog('info', 'Panel de administración iniciado');
    this.loadUsuarios();
    this.checkAllServices();
  }
  
  async loadUsuarios(): Promise<void> {
    this.loadingUsuarios.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<Usuario[]>>(`${environment.usuariosApiUrl}/usuarios`)
      );
      if (response.success && response.data) {
        this.usuarios.set(response.data);
        this.addLog('success', `${response.data.length} usuarios cargados`);
      }
    } catch (error) {
      this.addLog('error', 'Error al cargar usuarios');
      this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 3000 });
    } finally {
      this.loadingUsuarios.set(false);
    }
  }
  
  async changeUserRole(user: Usuario, newRole: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.put<ApiResponse<unknown>>(`${environment.usuariosApiUrl}/usuarios/${user.id}`, {
          nombre: user.nombre,
          email: user.email,
          telefono: user.telefono,
          direccion: user.direccion,
          rol: newRole,
          activo: user.activo
        })
      );
      
      if (response.success) {
        this.addLog('success', `Rol de ${user.nombre} cambiado a ${newRole}`);
        this.snackBar.open(`Rol actualizado a ${newRole}`, 'Cerrar', { duration: 2000 });
        await this.loadUsuarios();
      }
    } catch (error) {
      this.addLog('error', `Error al cambiar rol de ${user.nombre}`);
      this.snackBar.open('Error al actualizar rol', 'Cerrar', { duration: 3000 });
    }
  }
  
  async toggleUserStatus(user: Usuario): Promise<void> {
    const newStatus = !user.activo;
    try {
      const response = await firstValueFrom(
        this.http.put<ApiResponse<unknown>>(`${environment.usuariosApiUrl}/usuarios/${user.id}`, {
          nombre: user.nombre,
          email: user.email,
          telefono: user.telefono,
          direccion: user.direccion,
          rol: user.rol,
          activo: newStatus
        })
      );
      
      if (response.success) {
        const statusText = newStatus ? 'activado' : 'desactivado';
        this.addLog('success', `Usuario ${user.nombre} ${statusText}`);
        this.snackBar.open(`Usuario ${statusText}`, 'Cerrar', { duration: 2000 });
        await this.loadUsuarios();
      }
    } catch (error) {
      this.addLog('error', `Error al cambiar estado de ${user.nombre}`);
      this.snackBar.open('Error al actualizar estado', 'Cerrar', { duration: 3000 });
    }
  }
  
  async deleteUser(user: Usuario): Promise<void> {
    if (!confirm(`¿Está seguro de eliminar a ${user.nombre}?`)) {
      return;
    }
    
    try {
      const response = await firstValueFrom(
        this.http.delete<ApiResponse<unknown>>(`${environment.usuariosApiUrl}/usuarios/${user.id}`)
      );
      
      if (response.success) {
        this.addLog('warn', `Usuario ${user.nombre} eliminado`);
        this.snackBar.open('Usuario eliminado', 'Cerrar', { duration: 2000 });
        await this.loadUsuarios();
      }
    } catch (error) {
      this.addLog('error', `Error al eliminar ${user.nombre}`);
      this.snackBar.open('Error al eliminar usuario', 'Cerrar', { duration: 3000 });
    }
  }
  
  checkAllServices(): void {
    const currentServices = this.services();
    this.services.set(currentServices.map(s => ({ ...s, status: 'checking' as const })));
    
    currentServices.forEach((service, index) => {
      this.checkServiceHealth(index);
    });
  }
  
  private checkServiceHealth(index: number): void {
    const service = this.services()[index];
    const apiUrl = this.getApiUrl(service.name);
    
    this.http.get<ApiResponse<unknown>>(`${apiUrl}/status`).pipe(
      timeout(5000),
      catchError(() => {
        // Intentar con otro endpoint
        return this.http.get<unknown>(`${apiUrl.replace('/api', '')}/health`).pipe(
          timeout(5000),
          catchError(() => of({ error: 'offline' }))
        );
      })
    ).subscribe(response => {
      const currentServices = [...this.services()];
      
      // Verificar si es error de forma segura
      const isOffline = response !== null && 
                        typeof response === 'object' && 
                        Object.prototype.hasOwnProperty.call(response, 'error') && 
                        (response as Record<string, unknown>)['error'] === 'offline';
      
      if (isOffline) {
        currentServices[index] = { ...currentServices[index], status: 'offline' };
        this.addLog('error', `${service.name} - OFFLINE`);
      } else {
        currentServices[index] = { ...currentServices[index], status: 'online' };
        this.addLog('info', `${service.name} - Online ✓`);
      }
      
      this.services.set(currentServices);
    });
  }
  
  private getApiUrl(name: string): string {
    if (name.includes('Usuarios')) return environment.usuariosApiUrl;
    if (name.includes('Pedidos')) return environment.pedidosApiUrl;
    if (name.includes('Pagos')) return environment.pagosApiUrl;
    return '';
  }
  
  private addLog(type: string, message: string): void {
    const currentLogs = this.logs();
    this.logs.set([{ type, message, timestamp: new Date() }, ...currentLogs].slice(0, 50));
  }
  
  clearLogs(): void {
    this.logs.set([]);
    this.addLog('info', 'Logs limpiados');
  }
}
