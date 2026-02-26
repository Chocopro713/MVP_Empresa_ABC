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
    
    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }
    
    .post-card {
      transition: transform 0.2s;
    }
    
    .post-card:hover {
      transform: translateY(-4px);
    }
    
    .post-icon {
      background: #e3f2fd;
      color: #1976d2;
      padding: 8px;
      border-radius: 50%;
    }
    
    mat-card-title {
      font-size: 16px !important;
      line-height: 1.4 !important;
    }
    
    mat-card-content p {
      color: #666;
      line-height: 1.6;
    }
    
    .load-more {
      display: flex;
      justify-content: center;
      margin-top: 32px;
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
