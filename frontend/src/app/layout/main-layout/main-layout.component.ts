import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #sidenav mode="side" opened class="sidenav" [class.dark-theme]="themeService.isDarkMode()">
        <div class="sidenav-header">
          <mat-icon class="logo-icon">storefront</mat-icon>
          <span class="logo-text">ABC Orders</span>
        </div>
        
        <mat-divider></mat-divider>
        
        <mat-nav-list>
          @for (item of filteredMenuItems(); track item.route) {
            <a mat-list-item 
               [routerLink]="item.route" 
               routerLinkActive="active-link"
               class="nav-item">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content class="content">
        <mat-toolbar color="primary" class="toolbar">
          <button mat-icon-button (click)="sidenav.toggle()" class="hide-desktop">
            <mat-icon>menu</mat-icon>
          </button>
          
          <span class="toolbar-title">Sistema de Gestión de Pedidos</span>
          
          <span class="spacer"></span>
          
          <div class="theme-toggle">
            <mat-icon>{{ themeService.isDarkMode() ? 'dark_mode' : 'light_mode' }}</mat-icon>
            <mat-slide-toggle 
              [checked]="themeService.isDarkMode()"
              (change)="themeService.toggleTheme()"
              color="accent">
            </mat-slide-toggle>
          </div>
          
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          
          <mat-menu #userMenu="matMenu">
            <div class="user-info">
              <mat-icon>person</mat-icon>
              <div>
                <strong>{{ authService.username() }}</strong>
                <small>{{ authService.userRole() | titlecase }}</small>
              </div>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Cerrar Sesión</span>
            </button>
          </mat-menu>
        </mat-toolbar>
        
        <main class="main-content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
    }
    
    .sidenav {
      width: 260px;
      background: linear-gradient(180deg, #3f51b5 0%, #303f9f 100%);
      color: white;
    }
    
    .dark-theme .sidenav {
      background: linear-gradient(180deg, #424242 0%, #303030 100%);
    }
    
    .sidenav-header {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logo-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    
    .logo-text {
      font-size: 20px;
      font-weight: 500;
    }
    
    .nav-item {
      color: rgba(255, 255, 255, 0.9) !important;
      margin: 4px 8px;
      border-radius: 8px;
    }
    
    .nav-item:hover {
      background: rgba(255, 255, 255, 0.1) !important;
    }
    
    .active-link {
      background: rgba(255, 255, 255, 0.2) !important;
    }
    
    .content {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .toolbar-title {
      font-size: 18px;
      margin-left: 8px;
    }
    
    .spacer {
      flex: 1 1 auto;
    }
    
    .theme-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-right: 16px;
    }
    
    .main-content {
      flex: 1;
      padding: 24px;
      overflow: auto;
      background-color: #fafafa;
    }
    
    .dark-theme .main-content {
      background-color: #212121;
    }
    
    .user-info {
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .user-info div {
      display: flex;
      flex-direction: column;
    }
    
    .user-info small {
      color: #666;
    }
    
    @media (max-width: 768px) {
      .sidenav {
        width: 100%;
      }
      
      .toolbar-title {
        font-size: 14px;
      }
    }
  `]
})
export class MainLayoutComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  menuItems: MenuItem[] = [
    { label: 'Inicio', icon: 'home', route: '/dashboard/home' },
    { label: 'Usuarios', icon: 'people', route: '/dashboard/users' },
    { label: 'Pedidos', icon: 'shopping_cart', route: '/dashboard/pedidos' },
    { label: 'Pagos', icon: 'payment', route: '/dashboard/pagos' },
    { label: 'Publicaciones', icon: 'article', route: '/dashboard/posts' },
    { label: 'Tareas', icon: 'check_circle', route: '/dashboard/todos' },
    { label: 'Administración', icon: 'admin_panel_settings', route: '/dashboard/admin', roles: ['admin'] }
  ];

  filteredMenuItems = computed(() => {
    const role = this.authService.userRole();
    const isAdmin = role === 'admin';
    
    return this.menuItems.filter(item => {
      if (!item.roles) return true;
      if (isAdmin) return true;
      return item.roles.includes(role ?? '');
    });
  });

  logout(): void {
    this.authService.logout();
  }
}
