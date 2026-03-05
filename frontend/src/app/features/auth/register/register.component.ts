import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
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
    MatSnackBarModule
  ],
  template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <div class="header-content">
            <mat-icon class="logo">person_add</mat-icon>
            <mat-card-title>Crear Cuenta</mat-card-title>
            <mat-card-subtitle>Complete el formulario para registrarse</mat-card-subtitle>
          </div>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre Completo</mat-label>
              <input matInput formControlName="nombre" placeholder="Ej: Juan Pérez">
              <mat-icon matSuffix>person</mat-icon>
              @if (registerForm.get('nombre')?.hasError('required') && registerForm.get('nombre')?.touched) {
                <mat-error>El nombre es requerido</mat-error>
              }
              @if (registerForm.get('nombre')?.hasError('minlength') && registerForm.get('nombre')?.touched) {
                <mat-error>Mínimo 2 caracteres</mat-error>
              }
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" placeholder="ejemplo@correo.com" type="email">
              <mat-icon matSuffix>email</mat-icon>
              @if (registerForm.get('email')?.hasError('required') && registerForm.get('email')?.touched) {
                <mat-error>El email es requerido</mat-error>
              }
              @if (registerForm.get('email')?.hasError('email') && registerForm.get('email')?.touched) {
                <mat-error>Ingrese un email válido</mat-error>
              }
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Teléfono</mat-label>
              <input matInput formControlName="telefono" placeholder="Ej: 3001234567">
              <mat-icon matSuffix>phone</mat-icon>
              @if (registerForm.get('telefono')?.hasError('required') && registerForm.get('telefono')?.touched) {
                <mat-error>El teléfono es requerido</mat-error>
              }
              @if (registerForm.get('telefono')?.hasError('pattern') && registerForm.get('telefono')?.touched) {
                <mat-error>Ingrese un teléfono válido (solo números)</mat-error>
              }
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Dirección (Opcional)</mat-label>
              <input matInput formControlName="direccion" placeholder="Ej: Calle 123 #45-67">
              <mat-icon matSuffix>location_on</mat-icon>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <input matInput 
                     [type]="hidePassword() ? 'password' : 'text'" 
                     formControlName="password" 
                     placeholder="Mín. 6 caracteres">
              <button mat-icon-button matSuffix type="button" (click)="togglePassword()">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (registerForm.get('password')?.hasError('required') && registerForm.get('password')?.touched) {
                <mat-error>La contraseña es requerida</mat-error>
              }
              @if (registerForm.get('password')?.hasError('minlength') && registerForm.get('password')?.touched) {
                <mat-error>Mínimo 6 caracteres</mat-error>
              }
              @if (registerForm.get('password')?.hasError('pattern') && registerForm.get('password')?.touched) {
                <mat-error>Debe incluir mayúscula, minúscula y número</mat-error>
              }
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirmar Contraseña</mat-label>
              <input matInput 
                     [type]="hideConfirmPassword() ? 'password' : 'text'" 
                     formControlName="confirmPassword" 
                     placeholder="Repita la contraseña">
              <button mat-icon-button matSuffix type="button" (click)="toggleConfirmPassword()">
                <mat-icon>{{ hideConfirmPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (registerForm.get('confirmPassword')?.hasError('required') && registerForm.get('confirmPassword')?.touched) {
                <mat-error>Confirme su contraseña</mat-error>
              }
              @if (registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched) {
                <mat-error>Las contraseñas no coinciden</mat-error>
              }
            </mat-form-field>

            <div class="password-requirements">
              <small>La contraseña debe contener:</small>
              <ul>
                <li [class.valid]="hasMinLength()">✓ Mínimo 6 caracteres</li>
                <li [class.valid]="hasUppercase()">✓ Al menos una mayúscula</li>
                <li [class.valid]="hasLowercase()">✓ Al menos una minúscula</li>
                <li [class.valid]="hasNumber()">✓ Al menos un número</li>
              </ul>
            </div>
            
            <button mat-raised-button 
                    color="primary" 
                    type="submit" 
                    class="full-width register-button"
                    [disabled]="registerForm.invalid || isLoading()">
              @if (isLoading()) {
                <mat-spinner diameter="24"></mat-spinner>
              } @else {
                <mat-icon>person_add</mat-icon>
                Crear Cuenta
              }
            </button>
          </form>
        </mat-card-content>
        
        <mat-card-footer>
          <div class="login-link">
            <p>¿Ya tienes cuenta? 
              <a routerLink="/login" mat-button color="primary">
                <mat-icon>login</mat-icon> Iniciar Sesión
              </a>
            </p>
          </div>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .register-container::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
      animation: pulse 15s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1) rotate(0deg); }
      50% { transform: scale(1.1) rotate(180deg); }
    }
    
    .register-card {
      width: 100%;
      max-width: 480px;
      padding: 32px;
      position: relative;
      z-index: 1;
      border-radius: 20px !important;
      background: var(--surface-color, #ffffff) !important;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3) !important;
      border: 1px solid var(--border-color, rgba(0,0,0,0.08));
      backdrop-filter: blur(10px);
      animation: slideUp 0.5s ease-out;
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
      font-size: 72px;
      width: 72px;
      height: 72px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 16px;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    
    mat-card-title {
      font-size: 28px !important;
      font-weight: 700 !important;
      margin-bottom: 8px;
      color: var(--text-color, #1a1a2e) !important;
    }

    mat-card-subtitle {
      color: var(--text-secondary, #666) !important;
      font-size: 14px !important;
    }
    
    .full-width {
      width: 100%;
    }
    
    mat-form-field {
      margin-bottom: 8px;
    }
    
    .register-button {
      height: 52px;
      font-size: 16px;
      font-weight: 600;
      margin-top: 16px;
      border-radius: 12px !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .register-button:hover:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }

    .register-button:disabled {
      opacity: 0.7;
    }
    
    .register-button mat-icon {
      margin-right: 8px;
    }
    
    .password-requirements {
      background: var(--surface-hover, #f8f9fa);
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 16px;
      border: 1px solid var(--border-color, #e0e0e0);
      transition: all 0.3s ease;
    }
    
    .password-requirements small {
      font-weight: 600;
      color: var(--text-secondary, #666);
      font-size: 13px;
    }
    
    .password-requirements ul {
      margin: 12px 0 0 0;
      padding-left: 0;
      list-style: none;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    
    .password-requirements li {
      font-size: 12px;
      color: var(--text-muted, #999);
      margin: 0;
      padding: 6px 10px;
      background: var(--surface-color, #fff);
      border-radius: 8px;
      border: 1px solid var(--border-color, #e0e0e0);
      transition: all 0.3s ease;
    }
    
    .password-requirements li.valid {
      color: #4caf50;
      background: rgba(76, 175, 80, 0.1);
      border-color: #4caf50;
    }
    
    mat-card-footer {
      padding: 20px 0 0 0;
      margin-top: 16px;
      border-top: 1px solid var(--border-color, #e0e0e0);
    }
    
    .login-link {
      text-align: center;
    }
    
    .login-link p {
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--text-secondary, #666);
      font-size: 14px;
    }

    .login-link a {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .login-link a:hover {
      opacity: 0.8;
    }

    @media (max-width: 480px) {
      .register-card {
        padding: 24px;
        margin: 16px;
      }

      .password-requirements ul {
        grid-template-columns: 1fr;
      }
    }

    :host-context(.dark-theme) .register-container {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }

    :host-context(.dark-theme) .register-card {
      background: #1e1e2e !important;
      border-color: rgba(255,255,255,0.1);
    }

    :host-context(.dark-theme) mat-card-title {
      color: #ffffff !important;
    }

    :host-context(.dark-theme) .password-requirements {
      background: rgba(255,255,255,0.05);
      border-color: rgba(255,255,255,0.1);
    }

    :host-context(.dark-theme) .password-requirements li {
      background: rgba(255,255,255,0.03);
      border-color: rgba(255,255,255,0.1);
      color: #a0a0a0;
    }

    :host-context(.dark-theme) .password-requirements li.valid {
      background: rgba(76, 175, 80, 0.15);
    }

    :host-context(.dark-theme) .login-link a {
      background: linear-gradient(135deg, #90caf9 0%, #ce93d8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    :host-context(.dark-theme) .login-link a.mat-mdc-button {
      --mdc-text-button-label-text-color: #90caf9;
    }

    :host-context(.dark-theme) mat-card-footer {
      border-color: rgba(255,255,255,0.1);
    }

    :host-context(.dark-theme) .login-link p {
      color: #b0b0b0;
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);

  registerForm: FormGroup;
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  isLoading = signal(false);

  constructor() {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]],
      direccion: [''],
      password: ['', [
        Validators.required, 
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePassword(): void {
    this.hidePassword.update((v: boolean) => !v);
  }

  toggleConfirmPassword(): void {
    this.hideConfirmPassword.update((v: boolean) => !v);
  }

  hasMinLength(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return password.length >= 6;
  }

  hasUppercase(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return /[A-Z]/.test(password);
  }

  hasLowercase(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return /[a-z]/.test(password);
  }

  hasNumber(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return /\d/.test(password);
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading.set(true);

    try {
      const formValue = this.registerForm.value;
      const result = await this.authService.register({
        nombre: formValue.nombre,
        email: formValue.email,
        password: formValue.password,
        telefono: formValue.telefono,
        direccion: formValue.direccion || ''
      });
      
      this.isLoading.set(false);

      if (result.success) {
        this.snackBar.open('¡Cuenta creada exitosamente!', 'Cerrar', {
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
