import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <div class="header-content">
            <mat-icon class="logo">storefront</mat-icon>
            <mat-card-title>Sistema de Gestión ABC</mat-card-title>
            <mat-card-subtitle>Inicie sesión para continuar</mat-card-subtitle>
          </div>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="username" placeholder="Ingrese su email" type="email">
              <mat-icon matSuffix>email</mat-icon>
              @if (loginForm.get('username')?.hasError('required') && loginForm.get('username')?.touched) {
                <mat-error>El email es requerido</mat-error>
              }
              @if (loginForm.get('username')?.hasError('email') && loginForm.get('username')?.touched) {
                <mat-error>Ingrese un email válido</mat-error>
              }
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <input matInput 
                     [type]="hidePassword() ? 'password' : 'text'" 
                     formControlName="password" 
                     placeholder="Ingrese su contraseña">
              <button mat-icon-button matSuffix type="button" (click)="togglePassword()">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
                <mat-error>La contraseña es requerida</mat-error>
              }
              @if (loginForm.get('password')?.hasError('minlength') && loginForm.get('password')?.touched) {
                <mat-error>Mínimo 6 caracteres</mat-error>
              }
            </mat-form-field>
            
            <button mat-raised-button 
                    color="primary" 
                    type="submit" 
                    class="full-width login-button"
                    [disabled]="loginForm.invalid || isLoading()">
              @if (isLoading()) {
                <mat-spinner diameter="24"></mat-spinner>
              } @else {
                <mat-icon>login</mat-icon>
                Iniciar Sesión
              }
            </button>
          </form>
          
          <mat-divider class="divider"></mat-divider>
          
          <div class="register-section">
            <p>¿No tienes cuenta?</p>
            <a mat-stroked-button color="accent" routerLink="/register" class="full-width register-link">
              <mat-icon>person_add</mat-icon>
              Crear Cuenta
            </a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      padding: 20px;
      position: relative;
      overflow: hidden;
    }
    
    .login-container::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 50%);
      animation: pulse 15s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    
    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 32px;
      border-radius: 24px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      position: relative;
      z-index: 1;
      animation: slideUp 0.4s ease-out;
    }
    
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .header-content {
      width: 100%;
      text-align: center;
      margin-bottom: 24px;
    }
    
    .logo {
      font-size: 56px;
      width: 56px;
      height: 56px;
      color: #667eea;
      margin-bottom: 16px;
      filter: drop-shadow(0 4px 8px rgba(102, 126, 234, 0.3));
    }
    
    :host ::ng-deep mat-card-title {
      font-size: 22px !important;
      font-weight: 600 !important;
      color: var(--text-primary) !important;
      margin-bottom: 8px !important;
    }
    
    :host ::ng-deep mat-card-subtitle {
      color: var(--text-secondary) !important;
      font-size: 14px !important;
    }
    
    .full-width {
      width: 100%;
    }
    
    mat-form-field {
      margin-bottom: 8px;
    }
    
    .login-button {
      height: 52px;
      font-size: 16px;
      font-weight: 600;
      margin-top: 16px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      transition: all 0.3s ease;
    }
    
    .login-button:hover:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }
    
    .login-button mat-icon {
      margin-right: 8px;
    }
    
    .divider {
      margin: 28px 0;
    }
    
    .register-section {
      text-align: center;
    }
    
    .register-section p {
      margin: 0 0 14px 0;
      color: var(--text-secondary);
      font-size: 14px;
    }
    
    .register-link {
      height: 48px;
      border-radius: 12px;
      font-weight: 500;
      border-color: var(--border-color);
      color: var(--text-primary);
    }
    
    .register-link:hover {
      background: var(--bg-secondary);
    }
    
    .register-link mat-icon {
      margin-right: 8px;
    }
    
    @media (max-width: 480px) {
      .login-card {
        padding: 24px;
        border-radius: 20px;
      }
      
      .logo {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);

  loginForm: FormGroup;
  hidePassword = signal(true);
  isLoading = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePassword(): void {
    this.hidePassword.update(v => !v);
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading.set(true);

    try {
      const result = await this.authService.login(this.loginForm.value);
      
      this.isLoading.set(false);

      if (result.success) {
        this.snackBar.open('¡Bienvenido!', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.router.navigate(['/dashboard']);
      } else {
        this.snackBar.open(result.message, 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    } catch (error) {
      this.isLoading.set(false);
      this.snackBar.open('Error al conectar con el servidor', 'Cerrar', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    }
  }
}
