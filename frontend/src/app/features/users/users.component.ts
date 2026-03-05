import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UsuariosService } from '../../core/services/usuarios.service';
import { AuthService } from '../../core/services/auth.service';
import { Usuario, CreateUsuario, UpdateUsuario } from '../../core/models/models';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    MatCardModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatChipsModule, 
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatTooltipModule
  ],
  template: `
    <div class="users-container">
      <div class="header">
        <div class="title-section">
          <h1>Usuarios</h1>
          <p class="subtitle">Gestión de usuarios del sistema</p>
        </div>
        <div class="actions-section">
          @if (authService.userRole() === 'admin') {
            <button mat-raised-button color="primary" (click)="openCreateDialog()">
              <mat-icon>person_add</mat-icon> Nuevo Usuario
            </button>
          }
        </div>
      </div>

      <!-- Barra de búsqueda (solo admin) -->
      @if (authService.userRole() === 'admin') {
        <div class="search-section">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Buscar usuarios</mat-label>
            <input matInput 
                   [(ngModel)]="searchTerm" 
                   (ngModelChange)="onSearchChange($event)"
                   placeholder="Buscar por nombre, email, teléfono o rol...">
            <mat-icon matSuffix>search</mat-icon>
            @if (searchTerm) {
              <button matSuffix mat-icon-button (click)="clearSearch()">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>
          <span class="results-count">{{ displayUsers().length }} resultado(s)</span>
        </div>
      }

      @if (authService.userRole() !== 'admin') {
        <mat-chip-set class="access-warning">
          <mat-chip color="accent">Vista limitada - Mostrando primeros 3 registros</mat-chip>
        </mat-chip-set>
      }
      
      @if (loading()) {
        <div class="loading">
          <mat-spinner></mat-spinner>
          <p>Cargando usuarios desde la base de datos...</p>
        </div>
      } @else if (error()) {
        <div class="error">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="loadUsers()">
            <mat-icon>refresh</mat-icon> Reintentar
          </button>
        </div>
      } @else {
        <!-- Formulario de creación/edición -->
        @if (showForm()) {
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>{{ editingUser() ? 'Editar Usuario' : 'Nuevo Usuario' }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form class="user-form" [formGroup]="userForm" (ngSubmit)="saveUser()">
                <mat-form-field appearance="outline">
                  <mat-label>Nombre</mat-label>
                  <input matInput formControlName="nombre">
                  @if (userForm.get('nombre')?.invalid && userForm.get('nombre')?.touched) {
                    <mat-error>
                      @if (userForm.get('nombre')?.hasError('required')) {
                        El nombre es requerido
                      } @else if (userForm.get('nombre')?.hasError('minlength')) {
                        El nombre debe tener al menos 2 caracteres
                      }
                    </mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" formControlName="email">
                  @if (userForm.get('email')?.invalid && userForm.get('email')?.touched) {
                    <mat-error>
                      @if (userForm.get('email')?.hasError('required')) {
                        El correo electrónico es requerido
                      } @else if (userForm.get('email')?.hasError('email')) {
                        El formato del correo electrónico no es válido
                      }
                    </mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Teléfono</mat-label>
                  <input matInput formControlName="telefono">
                  @if (userForm.get('telefono')?.invalid && userForm.get('telefono')?.touched) {
                    <mat-error>
                      @if (userForm.get('telefono')?.hasError('required')) {
                        El teléfono es requerido
                      } @else if (userForm.get('telefono')?.hasError('pattern')) {
                        El formato del teléfono no es válido
                      }
                    </mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Dirección</mat-label>
                  <input matInput formControlName="direccion" placeholder="Calle, número, ciudad, código postal...">
                  @if (userForm.get('direccion')?.invalid && userForm.get('direccion')?.touched) {
                    <mat-error>
                      @if (userForm.get('direccion')?.hasError('required')) {
                        La dirección es requerida
                      } @else if (userForm.get('direccion')?.hasError('minlength')) {
                        La dirección debe tener al menos 5 caracteres
                      }
                    </mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Rol</mat-label>
                  <mat-select formControlName="rol">
                    <mat-option value="Usuario">Usuario</mat-option>
                    <mat-option value="Administrador">Administrador</mat-option>
                  </mat-select>
                </mat-form-field>

                @if (editingUser()) {
                  <mat-form-field appearance="outline">
                    <mat-label>Estado</mat-label>
                    <mat-select formControlName="activo">
                      <mat-option [value]="true">Activo</mat-option>
                      <mat-option [value]="false">Inactivo</mat-option>
                    </mat-select>
                  </mat-form-field>
                }

                @if (formErrors().length > 0) {
                  <div class="server-errors">
                    @for (error of formErrors(); track error) {
                      <mat-error>{{ error }}</mat-error>
                    }
                  </div>
                }

                <div class="form-actions">
                  <button mat-button type="button" (click)="cancelForm()">Cancelar</button>
                  <button mat-raised-button color="primary" type="submit" [disabled]="saving() || userForm.invalid">
                    @if (saving()) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      {{ editingUser() ? 'Actualizar' : 'Crear' }}
                    }
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }

        <div class="users-grid">
          @for (user of displayUsers(); track user.id) {
            <mat-card class="user-card" [class.inactive]="!user.activo">
              <mat-card-header>
                <div mat-card-avatar class="avatar" [class]="getRolClass(user.rol)">
                  {{ user.nombre.charAt(0) }}
                </div>
                <mat-card-title>{{ user.nombre }}</mat-card-title>
                <mat-card-subtitle>
                  <mat-chip [color]="user.activo ? 'primary' : 'warn'" selected>
                    {{ user.activo ? 'Activo' : 'Inactivo' }}
                  </mat-chip>
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="info-row">
                  <mat-icon>email</mat-icon>
                  <span>{{ user.email }}</span>
                </div>
                <div class="info-row">
                  <mat-icon>phone</mat-icon>
                  <span>{{ user.telefono }}</span>
                </div>
                <div class="info-row">
                  <mat-icon>badge</mat-icon>
                  <span>Rol: {{ user.rol }}</span>
                </div>
                <div class="info-row">
                  <mat-icon>calendar_today</mat-icon>
                  <span>Registrado: {{ formatDate(user.fechaCreacion) }}</span>
                </div>
                <div class="info-row">
                  <mat-icon>home</mat-icon>
                  <span>Dirección: {{ user.direccion }}</span>
                </div>
              </mat-card-content>
              @if (authService.userRole() === 'admin') {
                <mat-card-actions align="end">
                  <button mat-icon-button color="primary" (click)="editUser(user)" matTooltip="Editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteUser(user)" matTooltip="Eliminar">
                    <mat-icon>delete</mat-icon>
                  </button>
                </mat-card-actions>
              }
            </mat-card>
          }
        </div>
        
        @if (displayUsers().length === 0) {
          <div class="no-data">
            <mat-icon>person_off</mat-icon>
            <p>{{ searchTerm ? 'No se encontraron usuarios con ese criterio' : 'No hay usuarios registrados' }}</p>
            @if (searchTerm) {
              <button mat-raised-button (click)="clearSearch()">Limpiar búsqueda</button>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .users-container {
      max-width: 1200px;
      margin: 0 auto;
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 16px;
      padding: 20px 24px;
      background: var(--bg-card);
      border-radius: 16px;
      border: 1px solid var(--border-color);
    }

    .title-section h1 {
      margin-bottom: 4px;
      color: var(--text-primary);
      font-size: 24px;
      font-weight: 600;
    }
    
    .subtitle {
      color: var(--text-secondary);
      margin: 0;
      font-size: 14px;
    }

    .search-section {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      padding: 16px 20px;
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    .search-field {
      flex: 1;
      max-width: 500px;
    }

    .results-count {
      color: var(--text-secondary);
      font-size: 14px;
    }

    .access-warning {
      margin-bottom: 16px;
    }

    .form-card {
      margin-bottom: 24px;
      padding: 20px;
      border-radius: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
    }

    .user-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .form-actions {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    
    .loading, .error, .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px;
      gap: 16px;
      color: var(--text-secondary);
    }
    
    .error mat-icon, .no-data mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--text-disabled);
    }
    
    .users-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }
    
    .user-card {
      transition: all 0.3s ease;
      border-radius: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
    }
    
    .user-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }

    .user-card.inactive {
      opacity: 0.6;
    }
    
    .avatar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 600;
      width: 44px;
      height: 44px;
      border-radius: 12px;
    }
    
    .avatar.admin {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    
    .avatar.moderador {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
    
    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
      color: var(--text-secondary);
    }
    
    .info-row mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--text-disabled);
    }

    .server-errors {
      grid-column: 1 / -1;
      background-color: rgba(244, 67, 54, 0.1);
      border: 1px solid var(--accent-red);
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .server-errors mat-error {
      color: var(--accent-red);
      font-size: 14px;
    }
    
    @media (max-width: 768px) {
      .header {
        flex-direction: column;
      }
      
      .search-section {
        flex-direction: column;
        align-items: stretch;
      }
      
      .search-field {
        max-width: none;
      }
      
      .users-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UsersComponent implements OnInit {
  private usuariosService = inject(UsuariosService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  authService = inject(AuthService);
  
  users = signal<Usuario[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  saving = signal(false);
  showForm = signal(false);
  editingUser = signal<Usuario | null>(null);
  formErrors = signal<string[]>([]);
  searchTerm = '';
  
  private searchSubject = new Subject<string>();

  // Formulario reactivo con validaciones
  userForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
    direccion: ['', [Validators.required, Validators.minLength(5)]],
    rol: ['Usuario'],
    activo: [true]
  });
  
  displayUsers = computed(() => {
    const allUsers = this.users();
    if (this.authService.userRole() === 'admin') {
      return allUsers;
    }
    return allUsers.slice(0, 3);
  });

  ngOnInit(): void {
    this.loadUsers();
    
    // Configurar búsqueda con debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((term: string) => {
      this.loadUsers(term);
    });
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.loadUsers();
  }

  loadUsers(search?: string): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.usuariosService.getAll(search).subscribe({
      next: (data: Usuario[]) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading users:', err);
        this.error.set('Error al cargar usuarios. Verifica que la API esté corriendo.');
        this.loading.set(false);
      }
    });
  }

  openCreateDialog(): void {
    this.editingUser.set(null);
    this.formErrors.set([]);
    this.userForm.reset({
      nombre: '',
      email: '',
      telefono: '',
      direccion: '',
      rol: 'Usuario',
      activo: true
    });
    this.showForm.set(true);
  }

  editUser(user: Usuario): void {
    this.editingUser.set(user);
    this.formErrors.set([]);
    this.userForm.patchValue({
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono,
      direccion: user.direccion,
      rol: user.rol,
      activo: user.activo
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingUser.set(null);
    this.formErrors.set([]);
  }

  saveUser(): void {
    // Marcar todos los campos como touched para mostrar errores
    this.userForm.markAllAsTouched();
    
    if (this.userForm.invalid) {
      return;
    }
    
    this.saving.set(true);
    this.formErrors.set([]);
    
    const formValue = this.userForm.value;
    
    if (this.editingUser()) {
      const updateData: UpdateUsuario = {
        nombre: formValue.nombre,
        email: formValue.email,
        telefono: formValue.telefono,
        direccion: formValue.direccion,
        rol: formValue.rol || 'Usuario',
        activo: formValue.activo ?? true
      };
      
      this.usuariosService.update(this.editingUser()!.id, updateData).subscribe({
        next: (response: any) => {
          this.snackBar.open(response.message || 'Usuario actualizado', 'Cerrar', { duration: 3000 });
          this.loadUsers();
          this.cancelForm();
          this.saving.set(false);
        },
        error: (err: any) => {
          this.handleServerError(err);
          this.saving.set(false);
        }
      });
    } else {
      const createData: CreateUsuario = {
        nombre: formValue.nombre,
        email: formValue.email,
        telefono: formValue.telefono,
        direccion: formValue.direccion,
        rol: formValue.rol
      };
      
      this.usuariosService.create(createData).subscribe({
        next: (response: any) => {
          this.snackBar.open(response.message || 'Usuario creado', 'Cerrar', { duration: 3000 });
          this.loadUsers();
          this.cancelForm();
          this.saving.set(false);
        },
        error: (err: any) => {
          this.handleServerError(err);
          this.saving.set(false);
        }
      });
    }
  }

  private handleServerError(err: any): void {
    const errorResponse = err.error;
    if (errorResponse?.errors && errorResponse.errors.length > 0) {
      this.formErrors.set(errorResponse.errors);
      this.snackBar.open(errorResponse.message || 'Error de validación', 'Cerrar', { duration: 5000 });
    } else if (errorResponse?.message) {
      this.formErrors.set([errorResponse.message]);
      this.snackBar.open(errorResponse.message, 'Cerrar', { duration: 5000 });
    } else {
      this.formErrors.set(['Error desconocido al procesar la solicitud']);
      this.snackBar.open('Error al procesar la solicitud', 'Cerrar', { duration: 3000 });
    }
  }

  deleteUser(user: Usuario): void {
    if (confirm(`¿Estás seguro de eliminar a ${user.nombre}?`)) {
      this.usuariosService.delete(user.id).subscribe({
        next: (response: any) => {
          this.snackBar.open(response.message || 'Usuario eliminado', 'Cerrar', { duration: 3000 });
          this.loadUsers();
        },
        error: (err: any) => {
          this.snackBar.open(err.error?.message || 'Error al eliminar', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  getRolClass(rol: string): string {
    return rol.toLowerCase();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
