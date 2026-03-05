import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { PagosService } from '../../core/services/pagos.service';
import { PedidosService } from '../../core/services/pedidos.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { AuthService } from '../../core/services/auth.service';
import { Pago, CreatePago, UpdatePago, Pedido, Usuario } from '../../core/models/models';
import { debounceTime, distinctUntilChanged, Subject, forkJoin } from 'rxjs';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatCardModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatChipsModule, 
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatAutocompleteModule
  ],
  template: `
    <div class="pagos-container">
      <div class="header">
        <div class="title-section">
          <h1>Pagos</h1>
          <p class="subtitle">Gestión de pagos y transacciones</p>
        </div>
        <div class="actions-section">
          @if (authService.userRole() === 'admin') {
            <button mat-raised-button color="primary" (click)="openCreateForm()">
              <mat-icon>add_card</mat-icon> Nuevo Pago
            </button>
          }
        </div>
      </div>

      <!-- Barra de búsqueda (solo admin) -->
      @if (authService.userRole() === 'admin') {
        <div class="search-section">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Buscar pagos</mat-label>
            <input matInput 
                   [(ngModel)]="searchTerm" 
                   (ngModelChange)="onSearchChange($event)"
                   placeholder="Buscar por transacción, estado, método de pago...">
            <mat-icon matSuffix>search</mat-icon>
            @if (searchTerm) {
              <button matSuffix mat-icon-button (click)="clearSearch()">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>
          <span class="results-count">{{ displayPagos().length }} resultado(s)</span>
        </div>
      } @else {
        <mat-chip-set class="access-warning">
          <mat-chip color="accent">Mostrando tus pagos</mat-chip>
        </mat-chip-set>
      }
      
      @if (loading()) {
        <div class="loading">
          <mat-spinner></mat-spinner>
          <p>Cargando pagos desde la base de datos...</p>
        </div>
      } @else if (error()) {
        <div class="error">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="loadPagos()">
            <mat-icon>refresh</mat-icon> Reintentar
          </button>
        </div>
      } @else {
        <!-- Formulario de creación/edición -->
        @if (showForm()) {
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>{{ editingPago() ? 'Editar Pago' : 'Nuevo Pago' }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form class="pago-form" (ngSubmit)="savePago()">
                @if (!editingPago()) {
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Seleccionar Pedido</mat-label>
                    <mat-select [(ngModel)]="formData.pedidoId" name="pedidoId" required (selectionChange)="onPedidoSelected($event.value)">
                      @for (pedido of pedidosPendientes(); track pedido.id) {
                        <mat-option [value]="pedido.id">
                          {{ pedido.numeroOrden }} - {{ pedido.usuarioNombre || 'Sin nombre' }} ({{ pedido.usuarioEmail || 'Sin email' }}) - {{ formatCurrency(pedido.total) }}
                        </mat-option>
                      }
                    </mat-select>
                    <mat-hint>Solo se muestran pedidos pendientes de pago</mat-hint>
                  </mat-form-field>

                  @if (selectedPedido()) {
                    <div class="pedido-info">
                      <h4>Información del Pedido</h4>
                      <p><strong>Cliente:</strong> {{ selectedPedido()!.usuarioNombre }} ({{ selectedPedido()!.usuarioEmail }})</p>
                      <p><strong>Dirección:</strong> {{ selectedPedido()!.direccionEnvio }}</p>
                      <p><strong>Total a pagar:</strong> {{ formatCurrency(selectedPedido()!.total) }}</p>
                    </div>
                  }

                  <mat-form-field appearance="outline">
                    <mat-label>Monto</mat-label>
                    <input matInput type="number" [(ngModel)]="formData.monto" name="monto" required>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Moneda</mat-label>
                    <mat-select [(ngModel)]="formData.moneda" name="moneda">
                      <mat-option value="USD">USD</mat-option>
                      <mat-option value="EUR">EUR</mat-option>
                      <mat-option value="COP">COP</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Método de Pago</mat-label>
                    <mat-select [(ngModel)]="formData.metodoPago" name="metodoPago">
                      <mat-option value="TarjetaCredito">Tarjeta de Crédito</mat-option>
                      <mat-option value="TarjetaDebito">Tarjeta de Débito</mat-option>
                      <mat-option value="Transferencia">Transferencia</mat-option>
                      <mat-option value="PayPal">PayPal</mat-option>
                    </mat-select>
                  </mat-form-field>
                }

                @if (editingPago()) {
                  <mat-form-field appearance="outline">
                    <mat-label>Estado</mat-label>
                    <mat-select [(ngModel)]="formData.estado" name="estado">
                      <mat-option value="Pendiente">Pendiente</mat-option>
                      <mat-option value="Completado">Completado</mat-option>
                      <mat-option value="Fallido">Fallido</mat-option>
                      <mat-option value="Reembolsado">Reembolsado</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Referencia de Pago</mat-label>
                    <input matInput [(ngModel)]="formData.referenciaPago" name="referenciaPago">
                  </mat-form-field>
                }

                <div class="form-actions">
                  <button mat-button type="button" (click)="cancelForm()">Cancelar</button>
                  <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
                    @if (saving()) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      {{ editingPago() ? 'Actualizar' : 'Crear' }}
                    }
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }

        <div class="pagos-grid">
          @for (pago of displayPagos(); track pago.id) {
            <mat-card class="pago-card">
              <mat-card-header>
                <mat-icon mat-card-avatar class="pago-icon" [class]="getEstadoClass(pago.estado)">
                  payment
                </mat-icon>
                <mat-card-title>{{ pago.numeroTransaccion }}</mat-card-title>
                <mat-card-subtitle>
                  <mat-chip [color]="getEstadoColor(pago.estado)" selected>
                    {{ pago.estado }}
                  </mat-chip>
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="amount">
                  <span class="currency">{{ pago.moneda }}</span>
                  <span class="value">\${{ pago.monto.toFixed(2) }}</span>
                </div>
                
                <div class="info-row">
                  <mat-icon>credit_card</mat-icon>
                  <span>{{ pago.metodoPago }}</span>
                </div>
                
                <div class="info-row">
                  <mat-icon>shopping_cart</mat-icon>
                  <span>Pedido: {{ pago.pedidoId.substring(0, 8) }}...</span>
                </div>
                
                @if (pago.referenciaPago) {
                  <div class="info-row">
                    <mat-icon>receipt</mat-icon>
                    <span>Ref: {{ pago.referenciaPago }}</span>
                  </div>
                }
                
                <div class="info-row">
                  <mat-icon>calendar_today</mat-icon>
                  <span>{{ formatDate(pago.fechaCreacion) }}</span>
                </div>
                
                @if (pago.fechaProcesamiento) {
                  <div class="info-row processed">
                    <mat-icon>check_circle</mat-icon>
                    <span>Procesado: {{ formatDate(pago.fechaProcesamiento) }}</span>
                  </div>
                }
              </mat-card-content>
              @if (authService.userRole() === 'admin') {
                <mat-card-actions align="end">
                  <button mat-icon-button color="primary" (click)="editPago(pago)" matTooltip="Editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deletePago(pago)" matTooltip="Eliminar">
                    <mat-icon>delete</mat-icon>
                  </button>
                </mat-card-actions>
              }
            </mat-card>
          }
        </div>
        
        @if (displayPagos().length === 0) {
          <div class="no-data">
            <mat-icon>payment</mat-icon>
            <p>{{ searchTerm ? 'No se encontraron pagos con ese criterio' : 'No hay pagos registrados' }}</p>
            @if (searchTerm) {
              <button mat-raised-button (click)="clearSearch()">Limpiar búsqueda</button>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .pagos-container {
      max-width: 1200px;
      margin: 0 auto;
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 16px;
      padding: 20px 24px;
      background: var(--bg-card);
      border-radius: 16px;
      border: 1px solid var(--border-color);
    }

    .title-section h1 {
      margin-bottom: 4px;
      color: var(--text-primary);
      font-size: 24px;
      font-weight: 600;
    }
    
    .subtitle {
      color: var(--text-secondary);
      margin: 0;
      font-size: 14px;
    }

    .search-section {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      padding: 16px 20px;
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    .search-field {
      flex: 1;
      max-width: 500px;
    }

    .results-count {
      color: var(--text-secondary);
      font-size: 14px;
    }

    .access-warning {
      margin-bottom: 16px;
    }

    .form-card {
      margin-bottom: 24px;
      padding: 20px;
      border-radius: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
    }

    .pago-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .pago-form .full-width {
      grid-column: 1 / -1;
    }

    .pedido-info {
      grid-column: 1 / -1;
      background: var(--bg-secondary);
      padding: 16px;
      border-radius: 12px;
      border-left: 4px solid #667eea;
    }

    .pedido-info h4 {
      margin: 0 0 12px 0;
      color: var(--text-primary);
      font-weight: 600;
    }

    .pedido-info p {
      margin: 4px 0;
      color: var(--text-secondary);
    }

    .form-actions {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    
    .loading, .error, .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px;
      gap: 16px;
      color: var(--text-secondary);
    }
    
    .error mat-icon, .no-data mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--text-disabled);
    }
    
    .pagos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }
    
    .pago-card {
      transition: all 0.3s ease;
      border-radius: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
    }
    
    .pago-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }
    
    .pago-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      width: 44px;
      height: 44px;
      border-radius: 12px;
    }
    
    .pago-icon.completado {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }
    
    .pago-icon.pendiente {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    
    .pago-icon.fallido {
      background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
    }
    
    .amount {
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      margin: 12px 0;
      color: white;
    }
    
    .amount .currency {
      font-size: 14px;
      opacity: 0.85;
    }
    
    .amount .value {
      font-size: 32px;
      font-weight: 700;
      margin-left: 4px;
    }
    
    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
      color: var(--text-secondary);
    }
    
    .info-row.processed {
      color: var(--accent-green);
    }
    
    .info-row mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--text-disabled);
    }
    
    .info-row.processed mat-icon {
      color: var(--accent-green);
    }
    
    @media (max-width: 768px) {
      .header {
        flex-direction: column;
      }
      
      .search-section {
        flex-direction: column;
        align-items: stretch;
      }
      
      .search-field {
        max-width: none;
      }
      
      .pagos-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PagosComponent implements OnInit {
  private pagosService = inject(PagosService);
  private pedidosService = inject(PedidosService);
  private usuariosService = inject(UsuariosService);
  private snackBar = inject(MatSnackBar);
  authService = inject(AuthService);
  
  pagos = signal<Pago[]>([]);
  pedidos = signal<Pedido[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  saving = signal(false);
  showForm = signal(false);
  editingPago = signal<Pago | null>(null);
  selectedPedido = signal<Pedido | null>(null);
  searchTerm = '';
  
  private searchSubject = new Subject<string>();

  // Computed para mostrar pagos filtrados por usuario (si no es admin)
  displayPagos = computed(() => {
    const allPagos = this.pagos();
    const isAdmin = this.authService.userRole() === 'admin';
    const currentUserId = this.authService.usuarioId();
    
    if (isAdmin) {
      return allPagos;
    }
    
    // Filtrar pagos del usuario actual
    return allPagos.filter(pago => pago.usuarioId === currentUserId);
  });

  // Filtrar solo pedidos pendientes
  pedidosPendientes = computed(() => {
    return this.pedidos().filter(p => 
      p.estado.toLowerCase() === 'pendiente' || 
      p.estado.toLowerCase() === 'enproceso'
    );
  });

  formData: any = {
    pedidoId: '',
    usuarioId: '',
    monto: 0,
    moneda: 'USD',
    metodoPago: 'TarjetaCredito',
    estado: 'Pendiente',
    referenciaPago: ''
  };

  ngOnInit(): void {
    this.loadPagos();
    this.loadPedidos();
    
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((term: string) => {
      this.loadPagos(term);
    });
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.loadPagos();
  }

  loadPagos(search?: string): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.pagosService.getAll(search).subscribe({
      next: (data: Pago[]) => {
        this.pagos.set(data);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading pagos:', err);
        this.error.set('Error al cargar pagos. Verifica que la API esté corriendo.');
        this.loading.set(false);
      }
    });
  }

  loadPedidos(): void {
    // Cargar pedidos y usuarios en paralelo para enriquecer los datos
    forkJoin({
      pedidos: this.pedidosService.getAll(),
      usuarios: this.usuariosService.getAll()
    }).subscribe({
      next: (result: { pedidos: Pedido[], usuarios: Usuario[] }) => {
        const { pedidos, usuarios } = result;
        // Crear un mapa de usuarios para búsqueda rápida
        const usuariosMap = new Map<string, Usuario>();
        usuarios.forEach((u: Usuario) => usuariosMap.set(u.id, u));
        
        // Enriquecer pedidos con datos de usuario
        const pedidosEnriquecidos = pedidos.map((p: Pedido) => ({
          ...p,
          usuarioNombre: usuariosMap.get(p.usuarioId)?.nombre || 'Usuario no encontrado',
          usuarioEmail: usuariosMap.get(p.usuarioId)?.email || ''
        }));
        
        this.pedidos.set(pedidosEnriquecidos);
      },
      error: (err: any) => {
        console.error('Error loading pedidos:', err);
      }
    });
  }

  onPedidoSelected(pedidoId: string): void {
    const pedido = this.pedidos().find(p => p.id === pedidoId);
    if (pedido) {
      this.selectedPedido.set(pedido);
      this.formData.usuarioId = pedido.usuarioId;
      this.formData.monto = pedido.total;
    }
  }

  openCreateForm(): void {
    this.editingPago.set(null);
    this.selectedPedido.set(null);
    this.formData = {
      pedidoId: '',
      usuarioId: '',
      monto: 0,
      moneda: 'USD',
      metodoPago: 'TarjetaCredito',
      estado: 'Pendiente',
      referenciaPago: ''
    };
    this.loadPedidos(); // Refresh pedidos
    this.showForm.set(true);
  }

  editPago(pago: Pago): void {
    this.editingPago.set(pago);
    this.formData = {
      estado: pago.estado,
      referenciaPago: pago.referenciaPago || ''
    };
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingPago.set(null);
  }

  savePago(): void {
    this.saving.set(true);
    
    if (this.editingPago()) {
      const updateData: UpdatePago = {
        estado: this.formData.estado,
        referenciaPago: this.formData.referenciaPago || undefined
      };
      
      this.pagosService.update(this.editingPago()!.id, updateData).subscribe({
        next: (response) => {
          this.snackBar.open(response.message || 'Pago actualizado', 'Cerrar', { duration: 3000 });
          this.loadPagos();
          this.cancelForm();
          this.saving.set(false);
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Error al actualizar', 'Cerrar', { duration: 3000 });
          this.saving.set(false);
        }
      });
    } else {
      const createData: CreatePago = {
        pedidoId: this.formData.pedidoId,
        usuarioId: this.formData.usuarioId,
        monto: this.formData.monto,
        moneda: this.formData.moneda,
        metodoPago: this.formData.metodoPago
      };
      
      this.pagosService.create(createData).subscribe({
        next: (response) => {
          this.snackBar.open(response.message || 'Pago creado', 'Cerrar', { duration: 3000 });
          this.loadPagos();
          this.cancelForm();
          this.saving.set(false);
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Error al crear', 'Cerrar', { duration: 3000 });
          this.saving.set(false);
        }
      });
    }
  }

  deletePago(pago: Pago): void {
    if (confirm(`¿Estás seguro de eliminar el pago ${pago.numeroTransaccion}?`)) {
      this.pagosService.delete(pago.id).subscribe({
        next: (response) => {
          this.snackBar.open(response.message || 'Pago eliminado', 'Cerrar', { duration: 3000 });
          this.loadPagos();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Error al eliminar', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  getEstadoColor(estado: string): 'primary' | 'accent' | 'warn' {
    switch (estado.toLowerCase()) {
      case 'completado': return 'primary';
      case 'pendiente': return 'accent';
      case 'fallido': return 'warn';
      default: return 'accent';
    }
  }

  getEstadoClass(estado: string): string {
    return estado.toLowerCase();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(value: number): string {
    return '$' + value.toFixed(2);
  }
}
