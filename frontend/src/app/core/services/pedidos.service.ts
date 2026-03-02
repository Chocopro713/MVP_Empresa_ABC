import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Pedido, CreatePedido, UpdatePedido, ApiResponse } from '../models/models';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class PedidosService {
  private http = inject(HttpClient);
  private baseUrl = environment.pedidosApiUrl;

  getAll(search?: string): Observable<Pedido[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<ApiResponse<Pedido[]>>(`${this.baseUrl}/pedidos`, { params })
      .pipe(map(response => response.data || []));
  }

  getById(id: string): Observable<Pedido | null> {
    return this.http.get<ApiResponse<Pedido>>(`${this.baseUrl}/pedidos/${id}`)
      .pipe(map(response => response.data));
  }

  getByUsuarioId(usuarioId: string): Observable<Pedido[]> {
    return this.http.get<ApiResponse<Pedido[]>>(`${this.baseUrl}/pedidos/usuario/${usuarioId}`)
      .pipe(map(response => response.data || []));
  }

  create(pedido: CreatePedido): Observable<ApiResponse<Pedido>> {
    return this.http.post<ApiResponse<Pedido>>(`${this.baseUrl}/pedidos`, pedido);
  }

  update(id: string, pedido: UpdatePedido): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/pedidos/${id}`, pedido);
  }

  delete(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/pedidos/${id}`);
  }
}
