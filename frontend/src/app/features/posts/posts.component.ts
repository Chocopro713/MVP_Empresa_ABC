import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Post } from '../../core/models/models';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatChipsModule, MatButtonModule],
  template: `
    <div class="posts-container">
      <div class="header">
        <h1>Publicaciones</h1>
        <p class="subtitle">Datos de JSONPlaceholder API</p>
        @if (authService.userRole() !== 'admin') {
          <mat-chip-set>
            <mat-chip color="warn">Acceso limitado - Solo 3 publicaciones</mat-chip>
          </mat-chip-set>
        }
      </div>
      
      @if (loading()) {
        <div class="loading">
          <mat-spinner></mat-spinner>
          <p>Cargando publicaciones...</p>
        </div>
      } @else {
        <div class="posts-grid">
          @for (post of displayPosts(); track post.id) {
            <mat-card class="post-card">
              <mat-card-header>
                <mat-icon mat-card-avatar class="post-icon">article</mat-icon>
                <mat-card-title>{{ post.title | titlecase }}</mat-card-title>
                <mat-card-subtitle>Usuario #{{ post.userId }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>{{ post.body }}</p>
              </mat-card-content>
              <mat-card-actions align="end">
                <button mat-button color="primary">
                  <mat-icon>visibility</mat-icon> Ver más
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
        
        @if (authService.userRole() === 'admin' && displayPosts().length < posts().length) {
          <div class="load-more">
            <button mat-raised-button color="primary" (click)="loadMore()">
              Cargar más publicaciones
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .posts-container {
      max-width: 1200px;
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
    
    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 24px;
    }
    
    .post-card {
      border-radius: 16px !important;
      background: var(--surface-color, #ffffff) !important;
      border: 1px solid var(--border-color, rgba(0,0,0,0.08));
      transition: all 0.3s ease;
      overflow: hidden;
    }
    
    .post-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.12);
    }
    
    .post-icon {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      color: #667eea !important;
      padding: 12px;
      border-radius: 12px !important;
      width: 44px !important;
      height: 44px !important;
      font-size: 20px !important;
    }
    
    mat-card-title {
      font-size: 16px !important;
      line-height: 1.5 !important;
      font-weight: 600 !important;
      color: var(--text-color, #1a1a2e) !important;
    }

    mat-card-subtitle {
      color: var(--text-secondary, #666) !important;
      font-size: 13px !important;
    }
    
    mat-card-content p {
      color: var(--text-secondary, #666);
      line-height: 1.7;
      font-size: 14px;
    }

    mat-card-actions {
      padding: 16px !important;
      border-top: 1px solid var(--border-color, #e0e0e0);
    }

    mat-card-actions button {
      border-radius: 8px;
    }
    
    .load-more {
      display: flex;
      justify-content: center;
      margin-top: 40px;
    }

    .load-more button {
      border-radius: 12px !important;
      padding: 12px 32px !important;
      font-weight: 600;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
    }

    .load-more button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }

    @media (max-width: 600px) {
      .posts-grid {
        grid-template-columns: 1fr;
      }
    }

    :host-context(.dark-theme) .post-card {
      background: #1e1e2e !important;
      border-color: rgba(255,255,255,0.1);
    }

    :host-context(.dark-theme) .post-card:hover {
      box-shadow: 0 12px 30px rgba(0,0,0,0.4);
    }

    :host-context(.dark-theme) mat-card-title {
      color: #ffffff !important;
    }

    :host-context(.dark-theme) mat-card-content p {
      color: #a0a0a0;
    }

    :host-context(.dark-theme) mat-card-actions {
      border-color: rgba(255,255,255,0.1);
    }

    :host-context(.dark-theme) .post-icon {
      background: rgba(102, 126, 234, 0.2);
    }
  `]
})
export class PostsComponent implements OnInit {
  private apiService = inject(ApiService);
  authService = inject(AuthService);
  
  posts = signal<Post[]>([]);
  loading = signal(true);
  displayCount = signal(10);
  
  displayPosts = computed(() => {
    const allPosts = this.posts();
    if (this.authService.userRole() !== 'admin') {
      return allPosts.slice(0, 3);
    }
    return allPosts.slice(0, this.displayCount());
  });

  ngOnInit(): void {
    this.loadPosts();
  }

  private loadPosts(): void {
    this.apiService.getPosts().subscribe({
      next: (data) => {
        this.posts.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading posts:', err);
        this.loading.set(false);
      }
    });
  }

  loadMore(): void {
    this.displayCount.update(count => Math.min(count + 10, this.posts().length));
  }
}
