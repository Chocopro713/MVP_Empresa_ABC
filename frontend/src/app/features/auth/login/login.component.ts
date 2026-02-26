import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
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
              <mat-label>Usuario</mat-label>
              <input matInput formControlName="username" placeholder="Ingrese su usuario">
              <mat-icon matSuffix>person</mat-icon>
              @if (loginForm.get('username')?.hasError('required') && loginForm.get('username')?.touched) {
                <mat-error>El usuario es requerido</mat-error>
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
                <mat-error>Mínimo 3 caracteres</mat-error>
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
        </mat-card-content>
        
        <mat-card-footer>
          <div class="credentials-hint">
            <p><strong>Credenciales de prueba:</strong></p>
            <p>Email: juan&#64;example.com</p>
            <p>Email: maria&#64;example.com</p>
            <p>Contraseña: cualquiera (mín. 3 caracteres)</p>
          </div>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    
    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 20px;
    }
    
    .header-content {
      width: 100%;
      text-align: center;
      margin-bottom: 20px;
    }
    
    .logo {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #3f51b5;
      margin-bottom: 16px;
    }
    
    mat-card-title {
      font-size: 24px !important;
      margin-bottom: 8px;
    }
    
    .full-width {
      width: 100%;
    }
    
    mat-form-field {
      margin-bottom: 16px;
    }
    
    .login-button {
      height: 48px;
      font-size: 16px;
      margin-top: 16px;
    }
    
    .login-button mat-icon {
      margin-right: 8px;
    }
    
    mat-card-footer {
      padding: 16px;
      background: #f5f5f5;
      border-radius: 0 0 4px 4px;
    }
    
    .credentials-hint {
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    
    .credentials-hint p {
      margin: 4px 0;
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
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(3)]]
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
