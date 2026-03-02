import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Pago, CreatePago, UpdatePago, ApiResponse } from '../models/models';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class PagosService {
  private http = inject(HttpClient);
  private baseUrl = environment.pagosApiUrl;

  getAll(search?: string): Observable<Pago[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<ApiResponse<Pago[]>>(`${this.baseUrl}/pagos`, { params })
      .pipe(map(response => response.data || []));
  }

  getById(id: string): Observable<Pago | null> {
    return this.http.get<ApiResponse<Pago>>(`${this.baseUrl}/pagos/${id}`)
      .pipe(map(response => response.data));
  }

  getByPedidoId(pedidoId: string): Observable<Pago[]> {
    return this.http.get<ApiResponse<Pago[]>>(`${this.baseUrl}/pagos/pedido/${pedidoId}`)
      .pipe(map(response => response.data || []));
  }

  getByUsuarioId(usuarioId: string): Observable<Pago[]> {
    return this.http.get<ApiResponse<Pago[]>>(`${this.baseUrl}/pagos/usuario/${usuarioId}`)
      .pipe(map(response => response.data || []));
  }

  create(pago: CreatePago): Observable<ApiResponse<Pago>> {
    return this.http.post<ApiResponse<Pago>>(`${this.baseUrl}/pagos`, pago);
  }

  update(id: string, pago: UpdatePago): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/pagos/${id}`, pago);
  }

  delete(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/pagos/${id}`);
  }
}
