import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { PedidosService } from '../../core/services/pedidos.service';
import { AuthService } from '../../core/services/auth.service';
import { Pedido } from '../../core/models/models';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatChipsModule, 
    MatButtonModule,
    MatTableModule,
    MatExpansionModule
  ],
  template: `
    <div class="pedidos-container">
      <div class="header">
        <h1>Pedidos</h1>
        <p class="subtitle">Datos desde MongoDB - API Pedidos (Puerto 5002)</p>
      </div>
      
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
        <div class="pedidos-grid">
          @for (pedido of pedidos(); track pedido.id) {
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
                  <mat-icon>calendar_today</mat-icon>
                  <span>{{ formatDate(pedido.fechaCreacion) }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
        
        @if (pedidos().length === 0) {
          <div class="no-data">
            <mat-icon>shopping_cart</mat-icon>
            <p>No hay pedidos registrados</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .pedidos-container {
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
    
    .pedidos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }
    
    .pedido-card {
      transition: transform 0.2s;
    }
    
    .pedido-card:hover {
      transform: translateY(-4px);
    }
    
    .pedido-icon {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
    
    .info-section {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 12px;
      margin: 12px 0;
    }
    
    .info-section h4 {
      margin: 0 0 8px 0;
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
    }
    
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .item-row:last-child {
      border-bottom: none;
    }
    
    .item-name {
      flex: 1;
    }
    
    .item-qty {
      color: #666;
      margin: 0 12px;
    }
    
    .item-price {
      font-weight: 500;
      color: #2e7d32;
    }
    
    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
      color: #666;
    }
    
    .info-row.total {
      font-size: 18px;
      color: #333;
    }
    
    .info-row mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #999;
    }
  `]
})
export class PedidosComponent implements OnInit {
  private pedidosService = inject(PedidosService);
  private authService = inject(AuthService);
  
  pedidos = signal<Pedido[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPedidos();
  }

  loadPedidos(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.pedidosService.getAll().subscribe({
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

  getEstadoColor(estado: string): 'primary' | 'accent' | 'warn' {
    switch (estado.toLowerCase()) {
      case 'completado': return 'primary';
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
