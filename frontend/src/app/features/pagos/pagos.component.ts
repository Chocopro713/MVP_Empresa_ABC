import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { PagosService } from '../../core/services/pagos.service';
import { AuthService } from '../../core/services/auth.service';
import { Pago } from '../../core/models/models';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatChipsModule, 
    MatButtonModule
  ],
  template: `
    <div class="pagos-container">
      <div class="header">
        <h1>Pagos</h1>
        <p class="subtitle">Datos desde MongoDB - API Pagos (Puerto 5003)</p>
      </div>
      
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
        <div class="pagos-grid">
          @for (pago of pagos(); track pago.id) {
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
            </mat-card>
          }
        </div>
        
        @if (pagos().length === 0) {
          <div class="no-data">
            <mat-icon>payment</mat-icon>
            <p>No hay pagos registrados</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .pagos-container {
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
    
    .pagos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    
    .pago-card {
      transition: transform 0.2s;
    }
    
    .pago-card:hover {
      transform: translateY(-4px);
    }
    
    .pago-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
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
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      margin: 12px 0;
      color: white;
    }
    
    .amount .currency {
      font-size: 14px;
      opacity: 0.8;
    }
    
    .amount .value {
      font-size: 28px;
      font-weight: 600;
      margin-left: 4px;
    }
    
    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
      color: #666;
    }
    
    .info-row.processed {
      color: #2e7d32;
    }
    
    .info-row mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #999;
    }
    
    .info-row.processed mat-icon {
      color: #2e7d32;
    }
  `]
})
export class PagosComponent implements OnInit {
  private pagosService = inject(PagosService);
  private authService = inject(AuthService);
  
  pagos = signal<Pago[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPagos();
  }

  loadPagos(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.pagosService.getAll().subscribe({
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
}
