import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { RealtimeService } from '../../services/realtime.service';

interface CategoryDto { id: string; nameAr: string; }
interface CreateRoomResponse { roomId: string; roomCode: string; }
interface JoinRoomResponse { roomId: string; roomCode: string; categoryName: string; }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container" style="max-width: 800px; margin-top: 50px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
        <h1 style="color: var(--primary);">سابق</h1>
        <button class="btn" style="background: transparent; color: var(--error);" (click)="logout()">تسجيل خروج</button>
      </div>

      <div class="card" style="margin-bottom: 30px;">
        <h2 style="margin-bottom: 15px;">إنشاء غرفة جديدة</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">كن المضيف وابدأ لعبة جديدة</p>
        <button class="btn btn-primary" style="width: 100%;" (click)="showCreateRoom = !showCreateRoom">
          {{ showCreateRoom ? 'إلغاء' : 'إنشاء غرفة' }}
        </button>

        <div *ngIf="showCreateRoom" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
          <!-- Category Selection -->
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">التصنيف:</label>
          <select [(ngModel)]="selectedCategoryId" style="width: 100%; padding: 12px; border: 1px solid #E5E7EB; border-radius: 8px; margin-bottom: 20px; font-size: 16px;">
            <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.nameAr }}</option>
          </select>

          <!-- Question Count -->
          <label style="display: block; margin-bottom: 10px;">عدد الأسئلة: {{ questionCount }}</label>
          <input type="range" [(ngModel)]="questionCount" min="5" max="30" step="5" style="width: 100%; margin-bottom: 20px;">
          
          <!-- Host Participation Toggle -->
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; background: #F9FAFB; border-radius: 8px; margin-bottom: 20px;">
            <div>
              <label style="font-weight: 500; display: block;">المشاركة في اللعبة</label>
              <span style="font-size: 13px; color: var(--text-secondary);">{{ hostParticipates ? 'ستلعب مع اللاعبين الآخرين' : 'ستشاهد فقط بدون مشاركة' }}</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" [(ngModel)]="hostParticipates">
              <span class="toggle-slider"></span>
            </label>
          </div>
          
          <button class="btn btn-accent" style="width: 100%;" (click)="createRoom()" [disabled]="loading || !selectedCategoryId">
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
  `,
  styles: [`
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 28px;
    }
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: 0.3s;
      border-radius: 28px;
    }
    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 22px;
      width: 22px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }
    input:checked + .toggle-slider {
      background-color: var(--accent);
    }
    input:checked + .toggle-slider:before {
      transform: translateX(22px);
    }
  `]
})
export class HomeComponent implements OnInit {
  showCreateRoom = false;
  questionCount = 10;
  roomCode = '';
  loading = false;
  errorMessage = '';
  categories: any[] = [];
  selectedCategoryId = '';
  hostParticipates = true;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private realtimeService: RealtimeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    this.apiService.getCategories().subscribe({
      next: (cats: CategoryDto[]) => {
        this.categories = cats;
        if (cats.length > 0) {
          this.selectedCategoryId = cats[0].id;
        }
      },
      error: (err: any) => console.error('Failed to load categories', err)
    });
  }

  createRoom(): void {
    if (!this.selectedCategoryId) return;

    // Clear cached game state from previous sessions
    this.realtimeService.resetState();
    
    this.loading = true;
    this.errorMessage = '';

    const request = {
      categoryIds: [this.selectedCategoryId],
      difficulties: [1, 2, 3],
      questionCount: this.questionCount,
      timeLimitSec: 15,
      hostParticipates: this.hostParticipates
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

    // Clear cached game state from previous sessions
    this.realtimeService.resetState();
    
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
