import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface CategoryDto { categoryId: string; name: string; questionCount: number; }
interface CreateRoomResponse { roomId: string; roomCode: string; }
interface JoinRoomResponse { roomId: string; roomCode: string; categoryName: string; }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container" style="max-width: 800px; margin-top: 50px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
        <h1 style="color: var(--primary);">سبق</h1>
        <button class="btn" style="background: transparent; color: var(--error);" (click)="logout()">تسجيل خروج</button>
      </div>

      <div class="card" style="margin-bottom: 30px;">
        <h2 style="margin-bottom: 15px;">إنشاء غرفة جديدة</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">كن المضيف وابدأ لعبة جديدة</p>
        <button class="btn btn-primary" style="width: 100%;" (click)="showCreateRoom = !showCreateRoom">
          {{ showCreateRoom ? 'إلغاء' : 'إنشاء غرفة' }}
        </button>

        <div *ngIf="showCreateRoom" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
          <label style="display: block; margin-bottom: 10px;">عدد الأسئلة: {{ questionCount }}</label>
          <input type="range" [(ngModel)]="questionCount" min="5" max="30" step="5" style="width: 100%; margin-bottom: 20px;">
          
          <button class="btn btn-accent" style="width: 100%;" (click)="createRoom()" [disabled]="loading">
            {{ loading ? 'جاري الإنشاء...' : 'تأكيد الإنشاء' }}
          </button>
        </div>
      </div>

      <div class="card">
        <h2 style="margin-bottom: 15px;">الانضمام إلى غرفة</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">أدخل رمز الغرفة للانضمام</p>
        <input 
          type="text" 
          [(ngModel)]="roomCode" 
          placeholder="رمز الغرفة"
          (keyup.enter)="joinRoom()"
          style="margin-bottom: 15px;">
        <p *ngIf="errorMessage" class="error">{{ errorMessage }}</p>
        <button class="btn btn-accent" style="width: 100%;" (click)="joinRoom()" [disabled]="loading">
          {{ loading ? 'جاري الانضمام...' : 'انضمام' }}
        </button>
      </div>
    </div>
  `
})
export class HomeComponent implements OnInit {
  showCreateRoom = false;
  questionCount = 10;
  roomCode = '';
  loading = false;
  errorMessage = '';
  categories: any[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    this.apiService.getCategories().subscribe({
      next: (cats: CategoryDto[]) => this.categories = cats,
      error: (err: any) => console.error('Failed to load categories', err)
    });
  }

  createRoom(): void {
    if (this.categories.length === 0) return;

    this.loading = true;
    this.errorMessage = '';

    const request = {
      categoryIds: [this.categories[0].id],
      difficulties: [1, 2, 3],
      questionCount: this.questionCount,
      timeLimitSec: 15
    };

    this.apiService.createRoom(request).subscribe({
      next: (response: CreateRoomResponse) => {
        this.router.navigate(['/lobby', response.roomCode]);
      },
      error: (error: any) => {
        this.errorMessage = 'فشل إنشاء الغرفة';
        this.loading = false;
      }
    });
  }

  joinRoom(): void {
    if (!this.roomCode.trim()) {
      this.errorMessage = 'الرجاء إدخال رمز الغرفة';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.apiService.joinRoom(this.roomCode.toUpperCase()).subscribe({
      next: () => {
        this.router.navigate(['/lobby', this.roomCode.toUpperCase()]);
      },
      error: () => {
        this.errorMessage = 'الغرفة غير موجودة';
        this.loading = false;
      }
    });
  }

  logout(): void {
    this.authService.clearAuth();
    this.router.navigate(['/login']);
  }
}
