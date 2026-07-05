import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { AdminApiService } from '../../services/admin-api.service';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="admin-login-page" dir="rtl">
      <div class="login-panel">
        <div class="brand">
          <span class="brand-mark">سابق</span>
          <span class="brand-subtitle">لوحة الإدارة</span>
        </div>

        <form class="login-form" (ngSubmit)="submit()" #adminLoginForm="ngForm">
          <h1>تسجيل دخول الإدارة</h1>
          <p>هذه الصفحة مخصصة لإدارة إحصائيات الموقع فقط.</p>

          @if (errorMessage) {
            <div class="error-message">{{ errorMessage }}</div>
          }

          <label>
            <span>اسم المستخدم</span>
            <input
              type="text"
              name="username"
              [(ngModel)]="username"
              autocomplete="username"
              required
              [disabled]="loading">
          </label>

          <label>
            <span>كلمة المرور</span>
            <input
              type="password"
              name="password"
              [(ngModel)]="password"
              autocomplete="current-password"
              required
              [disabled]="loading">
          </label>

          <button type="submit" [disabled]="loading || adminLoginForm.invalid">
            {{ loading ? 'جاري التحقق...' : 'دخول' }}
          </button>
        </form>
      </div>
    </section>
  `,
  styles: [`
    .admin-login-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 2rem;
      background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%);
      font-family: 'Cairo', sans-serif;
    }

    .login-panel {
      width: min(100%, 440px);
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 24px 80px rgba(15, 23, 42, 0.35);
      overflow: hidden;
    }

    .brand {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      color: #ffffff;
      background: #0f172a;
    }

    .brand-mark {
      font-family: 'Aref Ruqaa', 'Amiri', serif;
      font-size: 2rem;
      font-weight: 700;
      color: #f59e0b;
    }

    .brand-subtitle {
      color: rgba(255, 255, 255, 0.78);
      font-weight: 700;
    }

    .login-form {
      display: grid;
      gap: 1rem;
      padding: 1.5rem;
    }

    h1 {
      margin: 0;
      color: #0f172a;
      font-size: 1.55rem;
      line-height: 1.3;
    }

    p {
      margin: 0 0 0.25rem;
      color: #64748b;
      line-height: 1.7;
    }

    label {
      display: grid;
      gap: 0.45rem;
      color: #334155;
      font-weight: 700;
    }

    input {
      width: 100%;
      min-height: 46px;
      padding: 0.75rem 0.9rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      color: #0f172a;
      font: inherit;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    button {
      min-height: 48px;
      border: 0;
      border-radius: 6px;
      background: #1d4ed8;
      color: #ffffff;
      font: inherit;
      font-weight: 800;
      cursor: pointer;
      transition: background 0.2s ease, transform 0.2s ease;
    }

    button:hover:not(:disabled) {
      background: #1e40af;
      transform: translateY(-1px);
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.65;
    }

    .error-message {
      padding: 0.85rem 1rem;
      border-radius: 6px;
      color: #991b1b;
      background: #fee2e2;
      border: 1px solid #fecaca;
      font-weight: 700;
    }
  `]
})
export class AdminLoginComponent implements OnInit {
  username = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(
    private adminApiService: AdminApiService,
    private adminAuthService: AdminAuthService,
    private router: Router,
    private title: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {
    this.title.setTitle('تسجيل دخول الإدارة | سابق');
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });

    if (this.adminAuthService.isAdminLoggedIn) {
      this.router.navigate(['/admin']);
    }
  }

  submit(): void {
    if (this.loading || !this.username.trim() || !this.password) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.adminApiService.login(this.username.trim(), this.password).subscribe({
      next: (response) => {
        this.adminAuthService.setAdminAuth(response.token, response.username, response.expiresAtUtc);
        this.router.navigate(['/admin']);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'بيانات الدخول غير صحيحة أو غير مفعلة.';
      }
    });
  }
}
