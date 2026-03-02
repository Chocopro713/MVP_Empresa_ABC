import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Usuario, CreateUsuario, UpdateUsuario, ApiResponse } from '../models/models';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private http = inject(HttpClient);
  private baseUrl = environment.usuariosApiUrl;

  getAll(search?: string): Observable<Usuario[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<ApiResponse<Usuario[]>>(`${this.baseUrl}/usuarios`, { params })
      .pipe(map(response => response.data || []));
  }

  getById(id: string): Observable<Usuario | null> {
    return this.http.get<ApiResponse<Usuario>>(`${this.baseUrl}/usuarios/${id}`)
      .pipe(map(response => response.data));
  }

  create(usuario: CreateUsuario): Observable<ApiResponse<Usuario>> {
    return this.http.post<ApiResponse<Usuario>>(`${this.baseUrl}/usuarios`, usuario);
  }

  update(id: string, usuario: UpdateUsuario): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/usuarios/${id}`, usuario);
  }

  delete(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/usuarios/${id}`);
  }
}
