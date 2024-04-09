import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { User } from '../services/user';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router'; 

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'https://foodelivery-d2d7a5204308.herokuapp.com';
  private tokenKey = 'jwt_token';
  private isLoggedInSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(this.getToken() !== null);
  public isLoggedIn: Observable<boolean> = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) { } 

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users/auth`, { email, password }).pipe(
      tap(response => {
        console.log('Inicio de sesión exitoso');
        this.setToken(response.token);
        
        this.getUserProfile().subscribe(
          user => {
            console.log('Perfil del usuario:', user);
            if (user.role === 'ADMIN') {
              this.router.navigate(['/admin-dashboard']); 
            } else {
              this.router.navigate(['/home']);
            }
          },
          error => {
            console.error('Error al obtener el perfil del usuario:', error);
           
            this.router.navigate(['/home']);
          }
        );
      })
    );
  }
  
  register(user: User): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users`, user);
  }
  
  setToken(token: string): void {
    const storage = this.getStorage();
    if (storage) {
      storage.setItem(this.tokenKey, token);
      this.isLoggedInSubject.next(true);
    }
  }

  getToken(): string | null {
    const storage = this.getStorage();
    if (storage) {
      return storage.getItem(this.tokenKey);
    }
    return null;
  }

  removeToken(): void {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(this.tokenKey);
      this.isLoggedInSubject.next(false);
    }
  }

  addTokenToHeaders(): HttpHeaders {
    const token = this.getToken();
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    } else {
      return new HttpHeaders();
    }
  }

  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/me`, { headers: this.addTokenToHeaders() });
  }

  updateUserProfile(user: User): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/users`, user, { headers: this.addTokenToHeaders() });
  }

  private getStorage(): Storage | null {
    if (typeof window !== 'undefined') {
      return sessionStorage;
    } else {
      return null;
    }
  }
}