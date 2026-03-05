import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PedidosService } from '../../core/services/pedidos.service';
import { PagosService } from '../../core/services/pagos.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { AuthService } from '../../core/services/auth.service';
import { Pedido, CreatePedido, UpdatePedido, CreateItemPedido, Usuario, CreatePago } from '../../core/models/models';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatCardModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatChipsModule, 
    MatButtonModule,
    MatTableModule,
    MatExpansionModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="pedidos-container">
      <div class="header">
        <div class="title-section">
          <h1>Pedidos</h1>
          <p class="subtitle">Gestión de pedidos y órdenes</p>
        </div>
        <div class="actions-section">
          @if (authService.userRole() === 'admin') {
            <button mat-raised-button color="primary" (click)="openCreateForm()">
              <mat-icon>add_shopping_cart</mat-icon> Nuevo Pedido
            </button>
          }
        </div>
      </div>

      <!-- Barra de búsqueda (solo admin) -->
      @if (authService.userRole() === 'admin') {
        <div class="search-section">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Buscar pedidos</mat-label>
            <input matInput 
                   [(ngModel)]="searchTerm" 
                   (ngModelChange)="onSearchChange($event)"
                   placeholder="Buscar por número de orden, estado, dirección...">
            <mat-icon matSuffix>search</mat-icon>
            @if (searchTerm) {
              <button matSuffix mat-icon-button (click)="clearSearch()">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>
          <span class="results-count">{{ displayPedidos().length }} resultado(s)</span>
        </div>
      } @else {
        <mat-chip-set class="access-warning">
          <mat-chip color="accent">Mostrando tus pedidos</mat-chip>
        </mat-chip-set>
      }
      
      @if (loading()) {
        <div class="loading">
          <mat-spinner></mat-spinner>
          <p>Cargando pedidos desde la base de datos...</p>
        </div>
      } @else if (error()) {
        <div class="error">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="loadPedidos()">
            <mat-icon>refresh</mat-icon> Reintentar
          </button>
        </div>
      } @else {
        <!-- Formulario de creación/edición -->
        @if (showForm()) {
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>{{ editingPedido() ? 'Editar Pedido' : 'Nuevo Pedido' }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form class="pedido-form" (ngSubmit)="savePedido()">
                @if (!editingPedido()) {
                  <mat-form-field appearance="outline">
                    <mat-label>Usuario</mat-label>
                    <mat-select [(ngModel)]="formData.usuarioId" name="usuarioId" required (selectionChange)="onUsuarioChange($event.value)">
                      @for (usuario of usuarios(); track usuario.id) {
                        <mat-option [value]="usuario.id">
                          {{ usuario.nombre }} ({{ usuario.email }})
                        </mat-option>
                      }
                    </mat-select>
                    <mat-hint>Seleccione el usuario para precargar su dirección</mat-hint>
                  </mat-form-field>
                }

                <mat-form-field appearance="outline">
                  <mat-label>Dirección de Envío</mat-label>
                  <input matInput [(ngModel)]="formData.direccionEnvio" name="direccionEnvio" required>
                </mat-form-field>

                @if (editingPedido()) {
                  <mat-form-field appearance="outline">
                    <mat-label>Estado</mat-label>
                    <mat-select [(ngModel)]="formData.estado" name="estado">
                      <mat-option value="Pendiente">Pendiente</mat-option>
                      <mat-option value="Pagado">Pagado</mat-option>
                      <mat-option value="EnProceso">En Proceso</mat-option>
                      <mat-option value="Enviado">Enviado</mat-option>
                      <mat-option value="Completado">Completado</mat-option>
                      <mat-option value="Cancelado">Cancelado</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <!-- Mostrar items actuales del pedido -->
                  @if (editingPedido()!.items && editingPedido()!.items.length > 0) {
                    <div class="existing-items-section">
                      <h4>Items Actuales del Pedido</h4>
                      @for (item of editingPedido()!.items; track item.productoId) {
                        <div class="existing-item-row">
                          <span class="item-name">{{ item.nombre }}</span>
                          <span class="item-qty">x{{ item.cantidad }}</span>
                          <span class="item-price">\${{ item.subtotal.toFixed(2) }}</span>
                        </div>
                      }
                      <div class="total-row">
                        <strong>Total actual: \${{ editingPedido()!.total.toFixed(2) }}</strong>
                      </div>
                    </div>
                  }

                  <!-- Permitir agregar nuevos items solo si está en Pendiente -->
                  @if (editingPedido()!.estado === 'Pendiente') {
                    <div class="items-section">
                      <h4>Agregar Nuevos Items</h4>
                      @for (item of formItems; track $index) {
                        <div class="item-form-row">
                          <mat-form-field appearance="outline">
                            <mat-label>Producto</mat-label>
                            <input matInput [(ngModel)]="item.nombre" [name]="'newItemNombre' + $index">
                          </mat-form-field>
                          <mat-form-field appearance="outline" class="small">
                            <mat-label>Cantidad</mat-label>
                            <input matInput type="number" [(ngModel)]="item.cantidad" [name]="'newItemCantidad' + $index">
                          </mat-form-field>
                          <mat-form-field appearance="outline" class="small">
                            <mat-label>Precio</mat-label>
                            <input matInput type="number" [(ngModel)]="item.precioUnitario" [name]="'newItemPrecio' + $index">
                          </mat-form-field>
                          <button mat-icon-button color="warn" type="button" (click)="removeItem($index)">
                            <mat-icon>remove_circle</mat-icon>
                          </button>
                        </div>
                      }
                      <button mat-button type="button" color="primary" (click)="addItem()">
                        <mat-icon>add</mat-icon> Agregar Item
                      </button>
                    </div>
                  }
                }

                @if (!editingPedido()) {
                  <div class="items-section">
                    <h4>Items del Pedido</h4>
                    @for (item of formItems; track $index) {
                      <div class="item-form-row">
                        <mat-form-field appearance="outline">
                          <mat-label>Producto</mat-label>
                          <input matInput [(ngModel)]="item.nombre" [name]="'itemNombre' + $index">
                        </mat-form-field>
                        <mat-form-field appearance="outline" class="small">
                          <mat-label>Cantidad</mat-label>
                          <input matInput type="number" [(ngModel)]="item.cantidad" [name]="'itemCantidad' + $index">
                        </mat-form-field>
                        <mat-form-field appearance="outline" class="small">
                          <mat-label>Precio</mat-label>
                          <input matInput type="number" [(ngModel)]="item.precioUnitario" [name]="'itemPrecio' + $index">
                        </mat-form-field>
                        <button mat-icon-button color="warn" type="button" (click)="removeItem($index)">
                          <mat-icon>remove_circle</mat-icon>
                        </button>
                      </div>
                    }
                    <button mat-button type="button" color="primary" (click)="addItem()">
                      <mat-icon>add</mat-icon> Agregar Item
                    </button>
                  </div>
                }

                <div class="form-actions">
                  <button mat-button type="button" (click)="cancelForm()">Cancelar</button>
                  <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
                    @if (saving()) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      {{ editingPedido() ? 'Actualizar' : 'Crear' }}
                    }
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }

        <!-- Modal de Pago -->
        @if (showPaymentModal()) {
          <div class="modal-overlay" (click)="cancelPayment()">
            <mat-card class="payment-modal" (click)="$event.stopPropagation()">
              <mat-card-header>
                <mat-icon mat-card-avatar class="payment-icon">payment</mat-icon>
                <mat-card-title>Procesar Pago</mat-card-title>
                <mat-card-subtitle>Pedido: {{ paymentPedido()?.numeroOrden }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="payment-details">
                  <div class="payment-amount">
                    <span class="label">Monto a pagar:</span>
                    <span class="amount">\${{ paymentPedido()?.total?.toFixed(2) }}</span>
                  </div>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Método de Pago</mat-label>
                    <mat-select [(ngModel)]="paymentMethod">
                      <mat-option value="Tarjeta de Crédito">
                        <mat-icon>credit_card</mat-icon> Tarjeta de Crédito
                      </mat-option>
                      <mat-option value="Tarjeta de Débito">
                        <mat-icon>credit_card</mat-icon> Tarjeta de Débito
                      </mat-option>
                      <mat-option value="PayPal">
                        <mat-icon>account_balance_wallet</mat-icon> PayPal
                      </mat-option>
                      <mat-option value="Transferencia Bancaria">
                        <mat-icon>account_balance</mat-icon> Transferencia Bancaria
                      </mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Moneda</mat-label>
                    <mat-select [(ngModel)]="paymentCurrency">
                      <mat-option value="USD">USD - Dólar Americano</mat-option>
                      <mat-option value="EUR">EUR - Euro</mat-option>
                      <mat-option value="COP">COP - Peso Colombiano</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <div class="simulation-notice">
                    <mat-icon>info</mat-icon>
                    <span>Este es un pago simulado. No se realizará ningún cargo real.</span>
                  </div>
                </div>
              </mat-card-content>
              <mat-card-actions align="end">
                <button mat-button (click)="cancelPayment()">Cancelar</button>
                <button mat-raised-button color="primary" (click)="confirmPayment()" [disabled]="processingPayment()">
                  @if (processingPayment()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    <mat-icon>check_circle</mat-icon> Confirmar Pago
                  }
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        }

        <div class="pedidos-grid">
          @for (pedido of displayPedidos(); track pedido.id) {
            <mat-card class="pedido-card">
              <mat-card-header>
                <mat-icon mat-card-avatar class="pedido-icon">shopping_cart</mat-icon>
                <mat-card-title>{{ pedido.numeroOrden }}</mat-card-title>
                <mat-card-subtitle>
                  <mat-chip [color]="getEstadoColor(pedido.estado)" selected>
                    {{ pedido.estado }}
                  </mat-chip>
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="info-section">
                  <h4>Items del Pedido</h4>
                  @for (item of pedido.items; track item.productoId) {
                    <div class="item-row">
                      <span class="item-name">{{ item.nombre }}</span>
                      <span class="item-qty">x{{ item.cantidad }}</span>
                      <span class="item-price">\${{ item.subtotal.toFixed(2) }}</span>
                    </div>
                  }
                </div>
                
                <div class="info-row total">
                  <mat-icon>attach_money</mat-icon>
                  <span>Total: <strong>\${{ pedido.total.toFixed(2) }}</strong></span>
                </div>
                
                <div class="info-row">
                  <mat-icon>location_on</mat-icon>
                  <span>{{ pedido.direccionEnvio }}</span>
                </div>

                <div class="info-row">
                  <mat-icon>person</mat-icon>
                  <span>{{ getUsuarioNombre(pedido.usuarioId) }}</span>
                </div>
                
                <div class="info-row">
                  <mat-icon>calendar_today</mat-icon>
                  <span>{{ formatDate(pedido.fechaCreacion) }}</span>
                </div>

                <!-- Botón de Pagar para pedidos pendientes -->
                @if (pedido.estado === 'Pendiente') {
                  <div class="payment-action">
                    <button mat-raised-button color="accent" (click)="openPaymentModal(pedido)" class="pay-button">
                      <mat-icon>payment</mat-icon> Pagar Pedido
                    </button>
                  </div>
                }
              </mat-card-content>
              @if (authService.userRole() === 'admin') {
                <mat-card-actions align="end">
                  <button mat-icon-button color="primary" (click)="editPedido(pedido)" matTooltip="Editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deletePedido(pedido)" matTooltip="Eliminar">
                    <mat-icon>delete</mat-icon>
                  </button>
                </mat-card-actions>
              }
            </mat-card>
          }
        </div>
        
        @if (displayPedidos().length === 0) {
          <div class="no-data">
            <mat-icon>shopping_cart</mat-icon>
            <p>{{ searchTerm ? 'No se encontraron pedidos con ese criterio' : 'No hay pedidos registrados' }}</p>
            @if (searchTerm) {
              <button mat-raised-button (click)="clearSearch()">Limpiar búsqueda</button>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .pedidos-container {
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

    .pedido-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .items-section {
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px;
      background: var(--bg-secondary);
    }

    .items-section h4 {
      margin: 0 0 16px 0;
      color: var(--text-primary);
      font-weight: 600;
    }

    .existing-items-section {
      border: 1px solid var(--accent-green);
      border-radius: 12px;
      padding: 16px;
      background: rgba(76, 175, 80, 0.08);
    }

    .existing-items-section h4 {
      margin: 0 0 12px 0;
      color: var(--accent-green);
      font-weight: 600;
    }

    .existing-item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(76, 175, 80, 0.2);
    }

    .existing-item-row:last-of-type {
      border-bottom: none;
    }

    .existing-item-row .item-name {
      flex: 1;
      font-weight: 500;
      color: var(--text-primary);
    }

    .existing-item-row .item-qty {
      color: var(--text-secondary);
      margin: 0 16px;
    }

    .existing-item-row .item-price {
      font-weight: 600;
      color: var(--accent-green);
    }

    .total-row {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 2px solid var(--accent-green);
      text-align: right;
      color: var(--accent-green);
      font-weight: 600;
    }

    .item-form-row {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
    }

    .item-form-row mat-form-field {
      flex: 1;
    }

    .item-form-row mat-form-field.small {
      flex: 0.5;
    }

    .form-actions {
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
    
    .pedidos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
    }
    
    .pedido-card {
      transition: all 0.3s ease;
      border-radius: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
    }
    
    .pedido-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }
    
    .pedido-icon {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      width: 44px;
      height: 44px;
      border-radius: 12px;
    }
    
    .info-section {
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 14px;
      margin: 12px 0;
      border: 1px solid var(--border-color);
    }
    
    .info-section h4 {
      margin: 0 0 10px 0;
      color: var(--text-secondary);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid var(--border-color);
    }
    
    .item-row:last-child {
      border-bottom: none;
    }
    
    .item-name {
      flex: 1;
      color: var(--text-primary);
    }
    
    .item-qty {
      color: var(--text-secondary);
      margin: 0 12px;
      font-size: 13px;
    }
    
    .item-price {
      font-weight: 600;
      color: var(--accent-green);
    }
    
    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
      color: var(--text-secondary);
    }
    
    .info-row.total {
      font-size: 18px;
      color: var(--text-primary);
      font-weight: 600;
    }
    
    .info-row mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--text-disabled);
    }

    .payment-action {
      margin-top: 16px;
      text-align: center;
    }

    .pay-button {
      width: 100%;
      border-radius: 8px;
    }

    /* Modal de Pago */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .payment-modal {
      width: 100%;
      max-width: 450px;
      margin: 16px;
      border-radius: 20px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
    }

    .payment-icon {
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

    .payment-details {
      padding: 16px 0;
    }

    .payment-amount {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      border-radius: 12px;
      margin-bottom: 16px;
      color: white;
    }

    .payment-amount .label {
      font-size: 14px;
      opacity: 0.9;
    }

    .payment-amount .amount {
      font-size: 32px;
      font-weight: 700;
    }

    .full-width {
      width: 100%;
    }

    .simulation-notice {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px;
      background: rgba(255, 152, 0, 0.12);
      border-radius: 10px;
      color: var(--accent-orange);
      font-size: 13px;
      margin-top: 16px;
      border: 1px solid rgba(255, 152, 0, 0.3);
    }

    .simulation-notice mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
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
      
      .pedidos-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PedidosComponent implements OnInit {
  private pedidosService = inject(PedidosService);
  private pagosService = inject(PagosService);
  private usuariosService = inject(UsuariosService);
  private snackBar = inject(MatSnackBar);
  authService = inject(AuthService);
  
  pedidos = signal<Pedido[]>([]);
  usuarios = signal<Usuario[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  saving = signal(false);
  showForm = signal(false);
  editingPedido = signal<Pedido | null>(null);
  searchTerm = '';

  // Computed para mostrar pedidos filtrados por usuario (si no es admin)
  displayPedidos = computed(() => {
    const allPedidos = this.pedidos();
    const isAdmin = this.authService.userRole() === 'admin';
    const currentUserId = this.authService.usuarioId();
    
    if (isAdmin) {
      return allPedidos;
    }
    
    // Filtrar pedidos del usuario actual
    return allPedidos.filter(pedido => pedido.usuarioId === currentUserId);
  });

  // Payment modal
  showPaymentModal = signal(false);
  paymentPedido = signal<Pedido | null>(null);
  processingPayment = signal(false);
  paymentMethod = 'Tarjeta de Crédito';
  paymentCurrency = 'USD';
  
  private searchSubject = new Subject<string>();

  formData: any = {
    usuarioId: '',
    direccionEnvio: '',
    estado: 'Pendiente'
  };

  formItems: CreateItemPedido[] = [];

  ngOnInit(): void {
    this.loadPedidos();
    this.loadUsuarios();
    
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.loadPedidos(term);
    });
  }

  loadUsuarios(): void {
    this.usuariosService.getAll().subscribe({
      next: (data: Usuario[]) => {
        this.usuarios.set(data);
      },
      error: (err: any) => {
        console.error('Error loading usuarios:', err);
      }
    });
  }

  getUsuarioNombre(usuarioId: string): string {
    const usuario = this.usuarios().find(u => u.id === usuarioId);
    return usuario ? `${usuario.nombre} (${usuario.email})` : 'Usuario desconocido';
  }

  onUsuarioChange(usuarioId: string): void {
    const usuario = this.usuarios().find((u: Usuario) => u.id === usuarioId);
    if (usuario && usuario.direccion) {
      this.formData.direccionEnvio = usuario.direccion;
      this.snackBar.open('Dirección precargada del usuario', 'OK', { duration: 2000 });
    }
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.loadPedidos();
  }

  loadPedidos(search?: string): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.pedidosService.getAll(search).subscribe({
      next: (data: Pedido[]) => {
        this.pedidos.set(data);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading pedidos:', err);
        this.error.set('Error al cargar pedidos. Verifica que la API esté corriendo.');
        this.loading.set(false);
      }
    });
  }

  openCreateForm(): void {
    this.editingPedido.set(null);
    this.formData = { usuarioId: '', direccionEnvio: '', estado: 'Pendiente' };
    this.formItems = [{ productoId: 'PROD001', nombre: '', cantidad: 1, precioUnitario: 0 }];
    this.showForm.set(true);
  }

  editPedido(pedido: Pedido): void {
    this.editingPedido.set(pedido);
    this.formData = {
      usuarioId: pedido.usuarioId,
      direccionEnvio: pedido.direccionEnvio,
      estado: pedido.estado
    };
    // Inicializar formItems vacío para agregar nuevos items si es pedido pendiente
    this.formItems = [];
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingPedido.set(null);
  }

  addItem(): void {
    this.formItems.push({ productoId: `PROD00${this.formItems.length + 1}`, nombre: '', cantidad: 1, precioUnitario: 0 });
  }

  removeItem(index: number): void {
    this.formItems.splice(index, 1);
  }

  savePedido(): void {
    this.saving.set(true);
    
    if (this.editingPedido()) {
      // Filtrar items válidos (con nombre)
      const nuevosItems = this.formItems.filter(i => i.nombre && i.nombre.trim() !== '');
      
      const updateData: UpdatePedido = {
        estado: this.formData.estado,
        direccionEnvio: this.formData.direccionEnvio,
        nuevosItems: nuevosItems.length > 0 ? nuevosItems : undefined
      };
      
      this.pedidosService.update(this.editingPedido()!.id, updateData).subscribe({
        next: (response) => {
          const mensaje = nuevosItems.length > 0 
            ? `Pedido actualizado con ${nuevosItems.length} nuevo(s) item(s)` 
            : 'Pedido actualizado';
          this.snackBar.open(response.message || mensaje, 'Cerrar', { duration: 3000 });
          this.loadPedidos();
          this.cancelForm();
          this.saving.set(false);
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Error al actualizar', 'Cerrar', { duration: 3000 });
          this.saving.set(false);
        }
      });
    } else {
      const createData: CreatePedido = {
        usuarioId: this.formData.usuarioId,
        direccionEnvio: this.formData.direccionEnvio,
        items: this.formItems.filter(i => i.nombre)
      };
      
      this.pedidosService.create(createData).subscribe({
        next: (response) => {
          this.snackBar.open(response.message || 'Pedido creado', 'Cerrar', { duration: 3000 });
          this.loadPedidos();
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

  deletePedido(pedido: Pedido): void {
    if (confirm(`¿Estás seguro de eliminar el pedido ${pedido.numeroOrden}?`)) {
      this.pedidosService.delete(pedido.id).subscribe({
        next: (response) => {
          this.snackBar.open(response.message || 'Pedido eliminado', 'Cerrar', { duration: 3000 });
          this.loadPedidos();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Error al eliminar', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  // ========== PAYMENT METHODS ==========
  openPaymentModal(pedido: Pedido): void {
    this.paymentPedido.set(pedido);
    this.paymentMethod = 'Tarjeta de Crédito';
    this.paymentCurrency = 'USD';
    this.showPaymentModal.set(true);
  }

  cancelPayment(): void {
    this.showPaymentModal.set(false);
    this.paymentPedido.set(null);
  }

  confirmPayment(): void {
    const pedido = this.paymentPedido();
    if (!pedido) return;

    this.processingPayment.set(true);

    // Simular delay de procesamiento de pago
    setTimeout(() => {
      // 1. Crear el pago
      const createPago: CreatePago = {
        pedidoId: pedido.id,
        usuarioId: pedido.usuarioId,
        monto: pedido.total,
        moneda: this.paymentCurrency,
        metodoPago: this.paymentMethod
      };

      this.pagosService.create(createPago).subscribe({
        next: (pagoResponse) => {
          // 2. Actualizar el estado del pedido a "Pagado"
          const updatePedido: UpdatePedido = {
            estado: 'Pagado',
            direccionEnvio: pedido.direccionEnvio
          };

          this.pedidosService.update(pedido.id, updatePedido).subscribe({
            next: () => {
              // 3. Actualizar el pago a estado "Completado"
              this.pagosService.update(pagoResponse.data!.id, {
                estado: 'Completado',
                referenciaPago: `SIM-${Date.now()}`
              }).subscribe({
                next: () => {
                  this.snackBar.open('¡Pago procesado exitosamente!', 'Cerrar', { 
                    duration: 4000,
                    panelClass: ['success-snackbar']
                  });
                  this.processingPayment.set(false);
                  this.cancelPayment();
                  this.loadPedidos();
                },
                error: () => {
                  this.snackBar.open('Pago registrado pero no se pudo actualizar estado', 'Cerrar', { duration: 3000 });
                  this.processingPayment.set(false);
                  this.cancelPayment();
                  this.loadPedidos();
                }
              });
            },
            error: () => {
              this.snackBar.open('Pago registrado pero no se pudo actualizar el pedido', 'Cerrar', { duration: 3000 });
              this.processingPayment.set(false);
              this.cancelPayment();
              this.loadPedidos();
            }
          });
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Error al procesar el pago', 'Cerrar', { duration: 3000 });
          this.processingPayment.set(false);
        }
      });
    }, 1500); // Simulamos 1.5 segundos de procesamiento
  }

  getEstadoColor(estado: string): 'primary' | 'accent' | 'warn' {
    switch (estado.toLowerCase()) {
      case 'completado': 
      case 'pagado':
        return 'primary';
      case 'pendiente': return 'accent';
      case 'cancelado': return 'warn';
      default: return 'accent';
    }
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
}
