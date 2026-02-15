import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { SeoService } from '../../services/seo.service';
import { JsonLdService, Question } from '../../services/json-ld.service';

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

interface Category {
  id: string;
  nameAr: string;
  questionCount: number;
}

@Component({
  selector: 'app-questions-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="questions-page">
      <div class="container">
        <nav class="breadcrumb" aria-label="breadcrumb">
          <a routerLink="/">الرئيسية</a>
          <span>›</span>
          <span *ngIf="!selectedCategory">الأسئلة</span>
          <ng-container *ngIf="selectedCategory">
            <a routerLink="/questions">الأسئلة</a>
            <span>›</span>
            <span>{{ selectedCategory }}</span>
          </ng-container>
        </nav>

        <h1>{{ pageTitle }}</h1>
        <p class="subtitle" *ngIf="!selectedCategory">
          استعرض مجموعة واسعة من الأسئلة في مختلف التصنيفات. اختبر معلوماتك وتعلم شيئاً جديداً!
        </p>

        <div class="filters">
          <div class="search-box">
            <input 
              type="text" 
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange($event)"
              placeholder="ابحث عن سؤال...">
          </div>

          <div class="filter-group">
            <select [(ngModel)]="selectedDifficulty" (ngModelChange)="onFilterChange()">
              <option value="">جميع المستويات</option>
              <option value="easy">سهل</option>
              <option value="medium">متوسط</option>
              <option value="hard">صعب</option>
            </select>
          </div>
        </div>

        <div class="categories-bar" *ngIf="categories.length > 0">
          <a 
            class="category-chip" 
            [class.active]="!selectedCategory"
            routerLink="/questions">
            الكل
          </a>
          <a 
            *ngFor="let cat of categories"
            class="category-chip"
            [class.active]="selectedCategory === cat.nameAr"
            [routerLink]="['/questions', getCategorySlug(cat)]">
            {{ cat.nameAr }} ({{ cat.questionCount }})
          </a>
        </div>

        <div class="loading" *ngIf="loading">
          <div class="spinner"></div>
          <p>جاري التحميل...</p>
        </div>

        <div class="questions-grid" *ngIf="!loading && questions.length > 0">
          <a 
            *ngFor="let q of questions; let i = index"
            class="question-card"
            [routerLink]="['/questions', q.categorySlug, q.slug]">
            <div class="question-number">#{{ (currentPage - 1) * pageSize + i + 1 }}</div>
            <h2 class="question-text">{{ q.textAr }}</h2>
            <div class="question-meta">
              <span class="category">{{ q.categoryNameAr }}</span>
              <span class="difficulty" [class]="q.difficulty.toLowerCase()">
                {{ getDifficultyLabel(q.difficulty) }}
              </span>
            </div>
          </a>
        </div>

        <div class="no-results" *ngIf="!loading && questions.length === 0">
          <p>لم يتم العثور على أسئلة مطابقة لبحثك.</p>
          <button class="btn btn-secondary" (click)="clearFilters()">إزالة الفلاتر</button>
        </div>

        <div class="pagination" *ngIf="totalPages > 1">
          <a 
            class="page-btn" 
            [class.disabled]="currentPage === 1"
            [routerLink]="[]"
            [queryParams]="{ page: currentPage - 1 }"
            queryParamsHandling="merge"
            *ngIf="currentPage > 1">
            السابق
          </a>
          
          <ng-container *ngFor="let page of getPageNumbers()">
            <span *ngIf="page === '...'" class="dots">...</span>
            <a 
              *ngIf="page !== '...'"
              class="page-btn" 
              [class.active]="currentPage === page"
              [routerLink]="[]"
              [queryParams]="{ page: page }"
              queryParamsHandling="merge">
              {{ page }}
            </a>
          </ng-container>

          <a 
            class="page-btn" 
            [class.disabled]="currentPage === totalPages"
            [routerLink]="[]"
            [queryParams]="{ page: currentPage + 1 }"
            queryParamsHandling="merge"
            *ngIf="currentPage < totalPages">
            التالي
          </a>
        </div>

        <div class="results-info" *ngIf="!loading && totalCount > 0">
          عرض {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, totalCount) }} من {{ totalCount }} سؤال
        </div>
      </div>
    </div>
  `,
  styles: [`
    .questions-page {
      min-height: 100vh;
      background: var(--background);
      padding: 40px 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .breadcrumb {
      margin-bottom: 30px;
      font-size: 14px;
      color: var(--text-secondary);
    }

    .breadcrumb a {
      color: var(--primary);
      text-decoration: none;
    }

    .breadcrumb a:hover {
      text-decoration: underline;
    }

    .breadcrumb span {
      margin: 0 8px;
    }

    h1 {
      color: var(--text-primary);
      font-size: 2.5rem;
      margin-bottom: 15px;
      text-align: center;
    }

    .subtitle {
      text-align: center;
      color: var(--text-secondary);
      font-size: 1.1rem;
      margin-bottom: 30px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .filters {
      display: flex;
      gap: 15px;
      margin-bottom: 25px;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 250px;
    }

    .search-box input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid var(--border);
      border-radius: 8px;
      font-size: 1rem;
      background: var(--card-bg);
      color: var(--text-primary);
    }

    .search-box input:focus {
      outline: none;
      border-color: var(--primary);
    }

    .filter-group select {
      padding: 12px 16px;
      border: 2px solid var(--border);
      border-radius: 8px;
      font-size: 1rem;
      background: var(--card-bg);
      color: var(--text-primary);
      min-width: 150px;
    }

    .categories-bar {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 30px;
    }

    .category-chip {
      padding: 8px 16px;
      background: var(--card-bg);
      border: 2px solid var(--border);
      border-radius: 20px;
      font-size: 14px;
      color: var(--text-secondary);
      text-decoration: none;
      transition: all 0.3s;
    }

    .category-chip:hover, .category-chip.active {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
    }

    .loading {
      text-align: center;
      padding: 60px 20px;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .questions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .question-card {
      background: var(--card-bg);
      padding: 25px;
      border-radius: 12px;
      text-decoration: none;
      transition: transform 0.3s, box-shadow 0.3s;
      display: block;
    }

    .question-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .question-number {
      font-size: 12px;
      color: var(--primary);
      font-weight: bold;
      margin-bottom: 10px;
    }

    .question-text {
      color: var(--text-primary);
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 15px;
    }

    .question-meta {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .category {
      background: var(--background);
      padding: 5px 12px;
      border-radius: 15px;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .difficulty {
      padding: 5px 12px;
      border-radius: 15px;
      font-size: 12px;
      font-weight: bold;
    }

    .difficulty.easy {
      background: #d4edda;
      color: #155724;
    }

    .difficulty.medium {
      background: #fff3cd;
      color: #856404;
    }

    .difficulty.hard {
      background: #f8d7da;
      color: #721c24;
    }

    .no-results {
      text-align: center;
      padding: 60px 20px;
      background: var(--card-bg);
      border-radius: 12px;
    }

    .no-results p {
      color: var(--text-secondary);
      margin-bottom: 20px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
    }

    .btn-secondary {
      background: var(--border);
      color: var(--text-primary);
    }

    .pagination {
      display: flex;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }

    .page-btn {
      padding: 10px 16px;
      background: var(--card-bg);
      border: 2px solid var(--border);
      border-radius: 8px;
      color: var(--text-primary);
      text-decoration: none;
      transition: all 0.3s;
    }

    .page-btn:hover:not(.disabled), .page-btn.active {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
    }

    .page-btn.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    .dots {
      padding: 10px;
      color: var(--text-secondary);
    }

    .results-info {
      text-align: center;
      color: var(--text-secondary);
      font-size: 14px;
    }

    @media (max-width: 768px) {
      h1 {
        font-size: 1.8rem;
      }

      .questions-grid {
        grid-template-columns: 1fr;
      }

      .filters {
        flex-direction: column;
      }

      .search-box {
        min-width: 100%;
      }
    }
  `]
})
export class QuestionsListComponent implements OnInit, OnDestroy {
  private readonly apiUrl = 'http://localhost:5213/api';
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  
  Math = Math;

  questions: Question[] = [];
  categories: Category[] = [];
  
  loading = false;
  searchTerm = '';
  selectedCategory = '';
  selectedDifficulty = '';
  
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  totalPages = 0;

  get pageTitle(): string {
    if (this.selectedCategory) {
      return `أسئلة ${this.selectedCategory}`;
    }
    return 'الأسئلة';
  }

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private seoService: SeoService,
    private jsonLdService: JsonLdService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    
    // Handle search debounce
    this.searchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadQuestions();
    });

    // Handle route changes
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const categorySlug = params.get('category');
      this.selectedCategory = categorySlug || '';
      this.loadQuestions();
    });

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.currentPage = parseInt(params.get('page') || '1', 10);
      this.searchTerm = params.get('search') || '';
      this.selectedDifficulty = params.get('difficulty') || '';
      this.loadQuestions();
    });

    this.updateSeo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories(): void {
    this.http.get<Category[]>(`${this.apiUrl}/questions/categories`)
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (err) => console.error('Error loading categories:', err)
      });
  }

  loadQuestions(): void {
    this.loading = true;
    
    let params: any = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize
    };

    if (this.selectedCategory) {
      params.categorySlug = this.selectedCategory;
    }
    if (this.selectedDifficulty) {
      params.difficulty = this.selectedDifficulty;
    }
    if (this.searchTerm) {
      params.searchTerm = this.searchTerm;
    }

    this.http.get<PaginatedResponse<Question>>(`${this.apiUrl}/questions`, { params })
      .subscribe({
        next: (response) => {
          this.questions = response.items;
          this.totalCount = response.totalCount;
          this.totalPages = response.totalPages;
          this.loading = false;
          this.updateSeo();
          
          // Add quiz schema for the questions
          if (this.questions.length > 0) {
            this.jsonLdService.setQuizSchema(this.questions, this.pageTitle);
          }
        },
        error: (err) => {
          console.error('Error loading questions:', err);
          this.loading = false;
        }
      });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.updateQueryParams();
    this.loadQuestions();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedDifficulty = '';
    this.currentPage = 1;
    this.updateQueryParams();
    this.loadQuestions();
  }

  updateQueryParams(): void {
    const queryParams: any = {};
    if (this.currentPage > 1) queryParams.page = this.currentPage;
    if (this.searchTerm) queryParams.search = this.searchTerm;
    if (this.selectedDifficulty) queryParams.difficulty = this.selectedDifficulty;
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  getCategorySlug(cat: Category): string {
    // Return slug based on category - you may need to adjust this
    return cat.nameAr.toLowerCase().replace(/\s+/g, '-');
  }

  getDifficultyLabel(difficulty: string): string {
    const labels: { [key: string]: string } = {
      'Easy': 'سهل',
      'Medium': 'متوسط',
      'Hard': 'صعب'
    };
    return labels[difficulty] || difficulty;
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible + 2) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (this.currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (this.currentPage < this.totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(this.totalPages);
    }
    
    return pages;
  }

  updateSeo(): void {
    const title = this.selectedCategory 
      ? `أسئلة ${this.selectedCategory}` 
      : 'الأسئلة';
    
    const description = this.selectedCategory
      ? `استعرض أسئلة ${this.selectedCategory} على منصة سابق. اختبر معلوماتك وتنافس مع الآخرين.`
      : 'استعرض مجموعة واسعة من الأسئلة في مختلف التصنيفات على منصة سابق.';

    this.seoService.updateSeo({
      title,
      description,
      keywords: `أسئلة, كويز, اختبارات, ${this.selectedCategory || 'ثقافة عامة'}, سابق`,
      type: 'website'
    });

    const breadcrumbs = [{ name: 'الرئيسية', url: '/' }];
    if (this.selectedCategory) {
      breadcrumbs.push({ name: 'الأسئلة', url: '/questions' });
      breadcrumbs.push({ name: this.selectedCategory, url: `/questions/${this.selectedCategory}` });
    } else {
      breadcrumbs.push({ name: 'الأسئلة', url: '/questions' });
    }
    
    this.jsonLdService.setBreadcrumbSchema(breadcrumbs);
  }
}
