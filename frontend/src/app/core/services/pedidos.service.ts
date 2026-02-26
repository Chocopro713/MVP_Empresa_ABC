import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pedido, CreatePedido, UpdatePedido } from '../models/models';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class PedidosService {
  private http = inject(HttpClient);
  private baseUrl = environment.pedidosApiUrl;

  getAll(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.baseUrl}/pedidos`);
  }

  getById(id: string): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.baseUrl}/pedidos/${id}`);
  }

  getByUsuarioId(usuarioId: string): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.baseUrl}/pedidos/usuario/${usuarioId}`);
  }

  create(pedido: CreatePedido): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.baseUrl}/pedidos`, pedido);
  }

  update(id: string, pedido: UpdatePedido): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/pedidos/${id}`, pedido);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/pedidos/${id}`);
  }
}
