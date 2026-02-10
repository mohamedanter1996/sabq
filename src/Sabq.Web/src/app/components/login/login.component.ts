import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface GuestLoginResponse { token: string; playerId: string; displayName: string; }

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container" style="max-width: 500px; margin-top: 100px;">
      <div class="card">
        <h1 style="text-align: center; color: var(--primary); font-size: 48px; margin-bottom: 10px;">سبق</h1>
        <p style="text-align: center; color: var(--secondary); font-size: 20px; margin-bottom: 40px;">جاوب الأول… واكسب</p>
        
        <h2 style="margin-bottom: 20px;">مرحباً بك!</h2>
        <p style="color: var(--text-secondary); margin-bottom: 30px;">أدخل اسم العرض للبدء</p>
        
        <input 
          type="text" 
          [(ngModel)]="displayName" 
          placeholder="اسم العرض"
          (keyup.enter)="login()"
          style="margin-bottom: 20px;">
        
        <p *ngIf="errorMessage" class="error">{{ errorMessage }}</p>
        
        <button 
          class="btn btn-primary" 
          style="width: 100%; margin-top: 10px;"
          (click)="login()"
          [disabled]="loading">
          {{ loading ? 'جاري التحميل...' : 'دخول' }}
        </button>
        
        <div *ngIf="loading" class="spinner"></div>
      </div>
    </div>
  `
})
export class LoginComponent {
  displayName = '';
  loading = false;
  errorMessage = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  login(): void {
    if (!this.displayName.trim()) {
      this.errorMessage = 'الرجاء إدخال اسم العرض';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.apiService.guestLogin(this.displayName.trim()).subscribe({
      next: (response: GuestLoginResponse) => {
        this.authService.setAuth(response.playerId, response.displayName, response.token);
        this.router.navigate(['/home']);
      },
      error: (error: any) => {
        this.errorMessage = 'فشل تسجيل الدخول';
        this.loading = false;
      }
    });
  }
}
