import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    
    let clonedRequest = req;
    
    // Always add X-API-Version header
    clonedRequest = req.clone({
      headers: req.headers.set('X-API-Version', '1.0')
    });
    
    // Add Authorization header if token exists and user is authenticated
    if (token && this.authService.isAuthenticated()) {
      clonedRequest = clonedRequest.clone({
        headers: clonedRequest.headers.set('Authorization', `Bearer ${token}`)
      });
    }
    
    return next.handle(clonedRequest);
  }
}
