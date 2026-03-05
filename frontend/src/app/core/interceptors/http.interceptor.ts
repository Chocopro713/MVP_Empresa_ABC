import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const httpInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  
  // No agregar token a las rutas de autenticación públicas
  const isPublicAuthRoute = req.url.includes('/auth/login') || 
                            req.url.includes('/auth/register') || 
                            req.url.includes('/auth/refresh');
  
  let authReq = req;
  const token = authService.token();
  
  // Agregar token JWT a las solicitudes autenticadas
  if (!isPublicAuthRoute && token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', error.status, error.message);
      
      // Si el token expiró (401) y no es una ruta de autenticación
      if (error.status === 401 && !isPublicAuthRoute) {
        // Verificar si el header indica que el token expiró
        const tokenExpired = error.headers?.get('Token-Expired') === 'true';
        
        if (tokenExpired) {
          // Intentar refrescar el token en segundo plano
          // El AuthService ya tiene lógica de refresh automático
          console.warn('Token expirado, redirigiendo a login...');
        }
        
        authService.logout();
      }
      
      // Para errores 403 (Forbidden), hacer logout
      if (error.status === 403) {
        console.warn('Acceso denegado (403)');
        authService.logout();
      }
      
      return throwError(() => error);
    })
  );
};
