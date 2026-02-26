import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pago, CreatePago, UpdatePago } from '../models/models';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class PagosService {
  private http = inject(HttpClient);
  private baseUrl = environment.pagosApiUrl;

  getAll(): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.baseUrl}/pagos`);
  }

  getById(id: string): Observable<Pago> {
    return this.http.get<Pago>(`${this.baseUrl}/pagos/${id}`);
  }

  getByPedidoId(pedidoId: string): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.baseUrl}/pagos/pedido/${pedidoId}`);
  }

  getByUsuarioId(usuarioId: string): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.baseUrl}/pagos/usuario/${usuarioId}`);
  }

  create(pago: CreatePago): Observable<Pago> {
    return this.http.post<Pago>(`${this.baseUrl}/pagos`, pago);
  }

  update(id: string, pago: UpdatePago): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/pagos/${id}`, pago);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/pagos/${id}`);
  }
}
