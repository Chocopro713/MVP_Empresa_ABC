import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario, CreateUsuario, UpdateUsuario } from '../models/models';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private http = inject(HttpClient);
  private baseUrl = environment.usuariosApiUrl;

  getAll(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.baseUrl}/usuarios`);
  }

  getById(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/usuarios/${id}`);
  }

  getByEmail(email: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/usuarios/email/${email}`);
  }

  create(usuario: CreateUsuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.baseUrl}/usuarios`, usuario);
  }

  update(id: string, usuario: UpdateUsuario): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/usuarios/${id}`, usuario);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/usuarios/${id}`);
  }
}
