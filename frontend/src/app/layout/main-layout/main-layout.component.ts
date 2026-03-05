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
      background: var(--bg-sidebar);
      border-right: none;
      box-shadow: var(--shadow-lg);
    }
    
    .sidenav-header {
      padding: 24px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    }
    
    .logo-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #ffffff;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }
    
    .logo-text {
      font-size: 22px;
      font-weight: 600;
      letter-spacing: 0.5px;
      color: #ffffff;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    
    mat-nav-list {
      padding: 12px 0;
    }
    
    .nav-item {
      margin: 4px 12px;
      border-radius: 12px;
      transition: all 0.2s ease;
      height: 48px;
    }
    
    /* Estilos del nav-item para texto siempre visible */
    .nav-item ::ng-deep .mdc-list-item__primary-text {
      color: rgba(255, 255, 255, 0.9) !important;
      font-weight: 500;
    }
    
    .nav-item ::ng-deep .mat-icon {
      color: rgba(255, 255, 255, 0.85) !important;
    }
    
    .nav-item:hover {
      background: rgba(255, 255, 255, 0.15) !important;
      transform: translateX(4px);
    }
    
    .nav-item:hover ::ng-deep .mdc-list-item__primary-text {
      color: #ffffff !important;
    }
    
    .nav-item:hover ::ng-deep .mat-icon {
      color: #ffffff !important;
    }
    
    .active-link {
      background: rgba(255, 255, 255, 0.2) !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .active-link ::ng-deep .mdc-list-item__primary-text {
      color: #ffffff !important;
      font-weight: 600;
    }
    
    .active-link ::ng-deep .mat-icon {
      color: #ffffff !important;
    }
    
    .content {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: var(--bg-tertiary);
    }
    
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--bg-card) !important;
      color: var(--text-primary) !important;
      border-bottom: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
    }
    
    .toolbar .mat-icon {
      color: var(--text-primary);
    }
    
    .toolbar-title {
      font-size: 18px;
      font-weight: 500;
      margin-left: 12px;
      color: var(--text-primary);
    }
    
    .spacer {
      flex: 1 1 auto;
    }
    
    .theme-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-right: 8px;
      padding: 4px 12px;
      border-radius: 20px;
      background: var(--bg-secondary);
      transition: background 0.2s ease;
    }
    
    .theme-toggle:hover {
      background: var(--bg-tertiary);
    }
    
    .theme-toggle .mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--accent-orange);
    }
    
    .main-content {
      flex: 1;
      padding: 24px;
      overflow: auto;
      background-color: var(--bg-tertiary);
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .user-info {
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--bg-secondary);
      border-radius: 8px;
      margin: 8px;
    }
    
    .user-info .mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--accent-blue);
    }
    
    .user-info div {
      display: flex;
      flex-direction: column;
    }
    
    .user-info strong {
      color: var(--text-primary);
      font-size: 14px;
    }
    
    .user-info small {
      color: var(--text-secondary);
      font-size: 12px;
    }
    
    @media (max-width: 768px) {
      .sidenav {
        width: 280px;
      }
      
      .toolbar-title {
        font-size: 14px;
      }
      
      .main-content {
        padding: 16px;
      }
      
      .theme-toggle {
        padding: 4px 8px;
      }
    }
  `]
})
export class MainLayoutComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  menuItems: MenuItem[] = [
    { label: 'Inicio', icon: 'home', route: '/dashboard/home' },
    { label: 'Pedidos', icon: 'shopping_cart', route: '/dashboard/pedidos' },
    { label: 'Pagos', icon: 'payment', route: '/dashboard/pagos' },
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
