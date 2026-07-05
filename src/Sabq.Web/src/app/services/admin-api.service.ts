import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdminAuthService } from './admin-auth.service';

export interface AdminLoginResponse {
  token: string;
  username: string;
  expiresAtUtc: string;
}

export interface AdminActivityStats {
  newPlayers: number;
  newRooms: number;
  newAnswers: number;
}

export interface AdminCategoryUsage {
  categorySlug: string;
  categoryNameAr: string;
  categoryNameEn: string;
  answerCount: number;
}

export interface AdminStatsSummary {
  totalPlayers: number;
  totalRooms: number;
  activeRooms: number;
  lobbyRooms: number;
  runningRooms: number;
  finishedRooms: number;
  abandonedRooms: number;
  staleRooms: number;
  totalAnswers: number;
  correctAnswers: number;
  correctAnswerRate: number;
  totalQuestions: number;
  activeQuestions: number;
  totalCategories: number;
  contactMessages: number;
  unreadContactMessages: number;
  lastUpdatedAtUtc: string;
  last7Days: AdminActivityStats;
  last30Days: AdminActivityStats;
  topCategories: AdminCategoryUsage[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private adminAuthService: AdminAuthService
  ) {}

  login(username: string, password: string): Observable<AdminLoginResponse> {
    return this.http.post<AdminLoginResponse>(`${this.apiUrl}/auth/admin`, { username, password });
  }

  getSummary(): Observable<AdminStatsSummary> {
    return this.http.get<AdminStatsSummary>(`${this.apiUrl}/admin/stats/summary`, {
      headers: this.getAdminHeaders()
    });
  }

  private getAdminHeaders(): HttpHeaders {
    const token = this.adminAuthService.token;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }
}
