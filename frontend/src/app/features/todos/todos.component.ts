import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Todo } from '../../core/models/models';

@Component({
  selector: 'app-todos',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatChipsModule, 
    MatCheckboxModule, 
    MatListModule
  ],
  template: `
    <div class="todos-container">
      <div class="header">
        <h1>Tareas</h1>
        <p class="subtitle">Datos de JSONPlaceholder API</p>
        @if (authService.userRole() !== 'admin') {
          <mat-chip-set>
            <mat-chip color="warn">Acceso limitado - Solo 3 tareas</mat-chip>
          </mat-chip-set>
        }
      </div>
      
      @if (loading()) {
        <div class="loading">
          <mat-spinner></mat-spinner>
          <p>Cargando tareas...</p>
        </div>
      } @else {
        <div class="stats">
          <mat-card class="stat-card completed">
            <mat-icon>check_circle</mat-icon>
            <div>
              <span class="stat-value">{{ completedCount() }}</span>
              <span class="stat-label">Completadas</span>
            </div>
          </mat-card>
          <mat-card class="stat-card pending">
            <mat-icon>pending</mat-icon>
            <div>
              <span class="stat-value">{{ pendingCount() }}</span>
              <span class="stat-label">Pendientes</span>
            </div>
          </mat-card>
        </div>
        
        <mat-card class="todos-list-card">
          <mat-card-content>
            <mat-list>
              @for (todo of displayTodos(); track todo.id) {
                <mat-list-item class="todo-item">
                  <mat-checkbox 
                    [checked]="todo.completed"
                    color="primary"
                    disabled>
                  </mat-checkbox>
                  <span class="todo-title" [class.completed]="todo.completed">
                    {{ todo.title }}
                  </span>
                  <span class="todo-user">Usuario #{{ todo.userId }}</span>
                </mat-list-item>
              }
            </mat-list>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .todos-container {
      max-width: 900px;
      margin: 0 auto;
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .header {
      margin-bottom: 28px;
    }
    
    .header h1 {
      margin-bottom: 4px;
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .subtitle {
      color: var(--text-secondary, #666);
      margin-bottom: 12px;
      font-size: 14px;
    }
    
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px;
      gap: 16px;
    }

    .loading p {
      color: var(--text-secondary, #666);
      font-size: 14px;
    }
    
    .stats {
      display: flex;
      gap: 20px;
      margin-bottom: 28px;
    }
    
    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      flex: 1;
      border-radius: 16px !important;
      background: var(--surface-color, #ffffff) !important;
      border: 1px solid var(--border-color, rgba(0,0,0,0.08));
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }
    
    .stat-card mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      padding: 12px;
      border-radius: 12px;
    }
    
    .stat-card.completed mat-icon {
      color: #4caf50;
      background: rgba(76, 175, 80, 0.1);
    }
    
    .stat-card.pending mat-icon {
      color: #ff9800;
      background: rgba(255, 152, 0, 0.1);
    }
    
    .stat-value {
      display: block;
      font-size: 32px;
      font-weight: 700;
      color: var(--text-color, #1a1a2e);
    }
    
    .stat-label {
      color: var(--text-secondary, #666);
      font-size: 14px;
      font-weight: 500;
    }
    
    .todos-list-card {
      padding: 0;
      border-radius: 16px !important;
      background: var(--surface-color, #ffffff) !important;
      border: 1px solid var(--border-color, rgba(0,0,0,0.08));
      overflow: hidden;
    }
    
    .todo-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color, #eee);
      transition: background 0.2s ease;
    }

    .todo-item:hover {
      background: var(--surface-hover, #f8f9fa);
    }
    
    .todo-item:last-child {
      border-bottom: none;
    }
    
    .todo-title {
      flex: 1;
      font-size: 14px;
      color: var(--text-color, #333);
      line-height: 1.5;
    }
    
    .todo-title.completed {
      text-decoration: line-through;
      color: var(--text-muted, #999);
    }
    
    .todo-user {
      font-size: 12px;
      color: var(--text-secondary, #666);
      background: var(--surface-hover, #f5f5f5);
      padding: 6px 12px;
      border-radius: 20px;
      font-weight: 500;
      border: 1px solid var(--border-color, #e0e0e0);
    }
    
    @media (max-width: 600px) {
      .stats {
        flex-direction: column;
      }

      .todo-item {
        flex-wrap: wrap;
      }

      .todo-user {
        margin-left: auto;
      }
    }

    :host-context(.dark-theme) .stat-card {
      background: #1e1e2e !important;
      border-color: rgba(255,255,255,0.1);
    }

    :host-context(.dark-theme) .stat-value {
      color: #ffffff;
    }

    :host-context(.dark-theme) .todos-list-card {
      background: #1e1e2e !important;
      border-color: rgba(255,255,255,0.1);
    }

    :host-context(.dark-theme) .todo-item {
      border-color: rgba(255,255,255,0.08);
    }

    :host-context(.dark-theme) .todo-item:hover {
      background: rgba(255,255,255,0.05);
    }

    :host-context(.dark-theme) .todo-title {
      color: #e0e0e0;
    }

    :host-context(.dark-theme) .todo-user {
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.1);
      color: #a0a0a0;
    }
  `]
})
export class TodosComponent implements OnInit {
  private apiService = inject(ApiService);
  authService = inject(AuthService);
  
  todos = signal<Todo[]>([]);
  loading = signal(true);
  
  displayTodos = computed(() => {
    const allTodos = this.todos();
    if (this.authService.userRole() === 'admin') {
      return allTodos;
    }
    return allTodos.slice(0, 3);
  });
  
  completedCount = computed(() => 
    this.displayTodos().filter(t => t.completed).length
  );
  
  pendingCount = computed(() => 
    this.displayTodos().filter(t => !t.completed).length
  );

  ngOnInit(): void {
    this.loadTodos();
  }

  private loadTodos(): void {
    this.apiService.getTodos().subscribe({
      next: (data) => {
        this.todos.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading todos:', err);
        this.loading.set(false);
      }
    });
  }
}
