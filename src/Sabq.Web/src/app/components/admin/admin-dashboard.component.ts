import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { AdminApiService, AdminStatsSummary } from '../../services/admin-api.service';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="admin-dashboard" dir="rtl">
      <header class="dashboard-header">
        <div>
          <p class="eyebrow">لوحة الإدارة</p>
          <h1>إحصائيات سابق</h1>
          <p class="subtitle">
            متابعة نشاط اللاعبين والأسئلة والغرف، مع تنظيف تلقائي للغرف المتروكة.
          </p>
          @if (summary) {
            <p class="refresh-note">آخر تحديث: {{ lastUpdatedLabel }}</p>
          }
        </div>
        <div class="header-actions">
          <span>{{ adminAuthService.username }}</span>
          <button type="button" class="secondary-button" (click)="loadSummary()" [disabled]="loading">
            تحديث
          </button>
          <button type="button" class="danger-button" (click)="logout()">خروج</button>
        </div>
      </header>

      @if (loading && !summary) {
        <div class="state-box">جاري تحميل الإحصائيات...</div>
      } @else if (errorMessage) {
        <div class="state-box error">
          <span>{{ errorMessage }}</span>
          <button type="button" (click)="loadSummary()">إعادة المحاولة</button>
        </div>
      } @else if (summary) {
        <div class="metrics-grid">
          <article class="metric-card"><span>اللاعبون</span><strong>{{ summary.totalPlayers | number }}</strong></article>
          <article class="metric-card"><span>كل الغرف</span><strong>{{ summary.totalRooms | number }}</strong></article>
          <article class="metric-card success"><span>غرف نشطة فعلا</span><strong>{{ summary.activeRooms | number }}</strong></article>
          <article class="metric-card"><span>غرف جارية</span><strong>{{ summary.runningRooms | number }}</strong></article>
          <article class="metric-card"><span>غرف في الانتظار</span><strong>{{ summary.lobbyRooms | number }}</strong></article>
          <article class="metric-card"><span>غرف منتهية</span><strong>{{ summary.finishedRooms | number }}</strong></article>
          <article class="metric-card danger"><span>غرف متروكة</span><strong>{{ summary.abandonedRooms | number }}</strong></article>
          <article class="metric-card warn"><span>غرف متأخرة عن المهلة</span><strong>{{ summary.staleRooms | number }}</strong></article>
          <article class="metric-card"><span>الإجابات</span><strong>{{ summary.totalAnswers | number }}</strong></article>
          <article class="metric-card"><span>الإجابات الصحيحة</span><strong>{{ summary.correctAnswers | number }}</strong></article>
          <article class="metric-card"><span>نسبة الصح</span><strong>{{ summary.correctAnswerRate | number:'1.0-2' }}%</strong></article>
          <article class="metric-card"><span>الأسئلة النشطة</span><strong>{{ summary.activeQuestions | number }}</strong></article>
          <article class="metric-card"><span>إجمالي الأسئلة</span><strong>{{ summary.totalQuestions | number }}</strong></article>
          <article class="metric-card"><span>التصنيفات</span><strong>{{ summary.totalCategories | number }}</strong></article>
          <article class="metric-card"><span>رسائل التواصل</span><strong>{{ summary.contactMessages | number }}</strong></article>
          <article class="metric-card warn"><span>رسائل غير مقروءة</span><strong>{{ summary.unreadContactMessages | number }}</strong></article>
        </div>

        <div class="panel-grid">
          <article class="panel">
            <h2>آخر 7 أيام</h2>
            <div class="activity-list">
              <span>لاعبون جدد <strong>{{ summary.last7Days.newPlayers | number }}</strong></span>
              <span>غرف جديدة <strong>{{ summary.last7Days.newRooms | number }}</strong></span>
              <span>إجابات جديدة <strong>{{ summary.last7Days.newAnswers | number }}</strong></span>
            </div>
          </article>

          <article class="panel">
            <h2>آخر 30 يوم</h2>
            <div class="activity-list">
              <span>لاعبون جدد <strong>{{ summary.last30Days.newPlayers | number }}</strong></span>
              <span>غرف جديدة <strong>{{ summary.last30Days.newRooms | number }}</strong></span>
              <span>إجابات جديدة <strong>{{ summary.last30Days.newAnswers | number }}</strong></span>
            </div>
          </article>
        </div>

        <article class="panel">
          <h2>أكثر التصنيفات استخداما</h2>
          @if (summary.topCategories.length === 0) {
            <p class="empty-text">لا توجد إجابات كافية لعرض التصنيفات بعد.</p>
          } @else {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>التصنيف</th>
                    <th>الرابط</th>
                    <th>عدد الإجابات</th>
                  </tr>
                </thead>
                <tbody>
                  @for (category of summary.topCategories; track category.categorySlug) {
                    <tr>
                      <td>{{ category.categoryNameAr || category.categoryNameEn }}</td>
                      <td>{{ category.categorySlug }}</td>
                      <td>{{ category.answerCount | number }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </article>
      }
    </section>
  `,
  styles: [`
    .admin-dashboard {
      min-height: 100vh;
      padding: 2rem;
      background: #f1f5f9;
      color: #0f172a;
      font-family: 'Cairo', sans-serif;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    h1, h2, p {
      margin: 0;
    }

    h1 {
      font-size: clamp(1.8rem, 4vw, 2.7rem);
      line-height: 1.2;
    }

    h2 {
      font-size: 1.15rem;
      margin-bottom: 1rem;
    }

    .eyebrow {
      margin: 0 0 0.3rem;
      color: #2563eb;
      font-weight: 800;
    }

    .subtitle,
    .refresh-note {
      margin-top: 0.55rem;
      color: #64748b;
    }

    .refresh-note {
      font-size: 0.9rem;
      font-weight: 700;
    }

    .header-actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 0.65rem;
    }

    .header-actions span {
      padding: 0.55rem 0.8rem;
      color: #334155;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-weight: 700;
    }

    button {
      min-height: 40px;
      padding: 0.55rem 0.9rem;
      border: 0;
      border-radius: 6px;
      font: inherit;
      font-weight: 800;
      cursor: pointer;
    }

    button:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    .secondary-button {
      color: #ffffff;
      background: #1d4ed8;
    }

    .danger-button {
      color: #ffffff;
      background: #b91c1c;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .metric-card,
    .panel,
    .state-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
    }

    .metric-card {
      display: grid;
      gap: 0.35rem;
      min-height: 112px;
      padding: 1rem;
      border-top: 4px solid #2563eb;
    }

    .metric-card.success {
      border-top-color: #16a34a;
    }

    .metric-card.warn {
      border-top-color: #f59e0b;
    }

    .metric-card.danger {
      border-top-color: #dc2626;
    }

    .metric-card span {
      color: #64748b;
      font-weight: 700;
    }

    .metric-card strong {
      font-size: 2rem;
      line-height: 1.1;
      overflow-wrap: anywhere;
    }

    .panel-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .panel {
      padding: 1.25rem;
    }

    .activity-list {
      display: grid;
      gap: 0.7rem;
    }

    .activity-list span {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.7rem 0;
      border-bottom: 1px solid #e2e8f0;
      color: #475569;
    }

    .activity-list span:last-child {
      border-bottom: 0;
    }

    .activity-list strong {
      color: #0f172a;
    }

    .table-wrap {
      overflow-x: auto;
    }

    table {
      width: 100%;
      min-width: 520px;
      border-collapse: collapse;
    }

    th,
    td {
      padding: 0.85rem;
      text-align: right;
      border-bottom: 1px solid #e2e8f0;
    }

    th {
      color: #475569;
      font-size: 0.9rem;
      background: #f8fafc;
    }

    .state-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      color: #475569;
      font-weight: 800;
    }

    .state-box.error {
      color: #991b1b;
      background: #fef2f2;
      border-color: #fecaca;
    }

    .state-box button {
      color: #ffffff;
      background: #991b1b;
    }

    .empty-text {
      color: #64748b;
      line-height: 1.8;
    }

    @media (max-width: 700px) {
      .admin-dashboard {
        padding: 1rem;
      }

      .dashboard-header {
        display: grid;
      }

      .header-actions {
        justify-content: stretch;
      }

      .header-actions > * {
        flex: 1;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  summary: AdminStatsSummary | null = null;
  loading = true;
  errorMessage = '';

  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private readonly refreshSeconds = Math.max(5, environment.adminDashboard?.refreshSeconds ?? 15);

  constructor(
    private adminApiService: AdminApiService,
    public adminAuthService: AdminAuthService,
    private router: Router,
    private title: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {
    this.title.setTitle('لوحة الإدارة | سابق');
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    this.loadSummary();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  get lastUpdatedLabel(): string {
    if (!this.summary?.lastUpdatedAtUtc) {
      return '';
    }

    return new Date(this.summary.lastUpdatedAtUtc).toLocaleString('ar-EG', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    });
  }

  loadSummary(silent = false): void {
    if (!silent) {
      this.loading = true;
    }

    this.errorMessage = '';

    this.adminApiService.getSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        if (error.status === 401 || error.status === 403) {
          this.adminAuthService.clearAdminAuth();
          this.router.navigate(['/admin/login']);
          return;
        }

        this.errorMessage = 'تعذر تحميل الإحصائيات الآن. حاول مرة أخرى.';
      }
    });
  }

  logout(): void {
    this.adminAuthService.clearAdminAuth();
    this.router.navigate(['/admin/login']);
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.loadSummary(true);
    }, this.refreshSeconds * 1000);
  }
}
