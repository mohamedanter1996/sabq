import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

const API_URL = 'http://localhost:5000/api';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.token;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  guestLogin(displayName: string): Observable<any> {
    return this.http.post(`${API_URL}/auth/guest`, { displayName });
  }

  getCategories(): Observable<any> {
    return this.http.get(`${API_URL}/rooms/categories`, { headers: this.getHeaders() });
  }

  createRoom(request: any): Observable<any> {
    return this.http.post(`${API_URL}/rooms`, request, { headers: this.getHeaders() });
  }

  joinRoom(code: string): Observable<any> {
    return this.http.post(`${API_URL}/rooms/${code}/join`, {}, { headers: this.getHeaders() });
  }

  startGame(code: string): Observable<any> {
    return this.http.post(`${API_URL}/rooms/${code}/start`, {}, { headers: this.getHeaders() });
  }
}
