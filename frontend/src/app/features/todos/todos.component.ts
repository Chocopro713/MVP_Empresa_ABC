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
    
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      gap: 16px;
    }
    
    .stats {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      flex: 1;
    }
    
    .stat-card mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
    }
    
    .stat-card.completed mat-icon {
      color: #4caf50;
    }
    
    .stat-card.pending mat-icon {
      color: #ff9800;
    }
    
    .stat-value {
      display: block;
      font-size: 28px;
      font-weight: 500;
    }
    
    .stat-label {
      color: #666;
      font-size: 14px;
    }
    
    .todos-list-card {
      padding: 0;
    }
    
    .todo-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #eee;
    }
    
    .todo-item:last-child {
      border-bottom: none;
    }
    
    .todo-title {
      flex: 1;
      font-size: 14px;
    }
    
    .todo-title.completed {
      text-decoration: line-through;
      color: #999;
    }
    
    .todo-user {
      font-size: 12px;
      color: #999;
      background: #f5f5f5;
      padding: 4px 8px;
      border-radius: 12px;
    }
    
    @media (max-width: 600px) {
      .stats {
        flex-direction: column;
      }
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
