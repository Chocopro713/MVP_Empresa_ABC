import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Clone request and add headers if authenticated
  let authReq = req;
  
  if (authService.isAuthenticated()) {
    authReq = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        'X-Custom-Auth': 'Bearer simulated-token'
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', error.status, error.message);
      
      if (error.status === 401) {
        authService.logout();
      }
      
      return throwError(() => error);
    })
  );
};
