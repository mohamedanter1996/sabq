import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { SeoService } from '../../services/seo.service';
import { JsonLdService, Question, Option } from '../../services/json-ld.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-question-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="question-page">
      <div class="container">
        <nav class="breadcrumb" aria-label="breadcrumb">
          <a routerLink="/">الرئيسية</a>
          <span>›</span>
          <a routerLink="/questions">الأسئلة</a>
          <span>›</span>
          <a [routerLink]="['/questions', question.categorySlug]" *ngIf="question">
            {{ question.categoryNameAr }}
          </a>
          <span *ngIf="question">›</span>
          <span *ngIf="question">{{ getTruncatedText(question.textAr, 30) }}</span>
        </nav>

        <div class="loading" *ngIf="loading">
          <div class="spinner"></div>
          <p>جاري التحميل...</p>
        </div>

        <div class="error-state" *ngIf="!loading && errorMessage">
          <h2>خطأ</h2>
          <p>{{ errorMessage }}</p>
          <a routerLink="/questions" class="btn btn-primary">العودة للأسئلة</a>
        </div>

        <article class="question-content" *ngIf="!loading && question && !errorMessage">
          <div class="question-header">
            <span class="category-badge">{{ question.categoryNameAr }}</span>
            <span class="difficulty-badge" [class]="question.difficulty.toLowerCase()">
              {{ getDifficultyLabel(question.difficulty) }}
            </span>
          </div>

          <h1 class="question-text">{{ question.textAr }}</h1>
          
          <p class="question-text-en" *ngIf="question.textEn">
            {{ question.textEn }}
          </p>

          <div class="options-section">
            <h2>الخيارات</h2>
            <div class="options-list">
              <div 
                *ngFor="let option of question.options; let i = index"
                class="option-item"
                [class.correct]="showAnswer && option.isCorrect"
                [class.incorrect]="showAnswer && !option.isCorrect">
                <span class="option-letter">{{ getOptionLetter(i) }}</span>
                <span class="option-text">{{ option.textAr }}</span>
                <span class="correct-badge" *ngIf="showAnswer && option.isCorrect">✓ صحيح</span>
              </div>
            </div>

            <button 
              class="btn btn-primary show-answer-btn" 
              (click)="showAnswer = true"
              *ngIf="!showAnswer">
              أظهر الإجابة الصحيحة
            </button>

            <div class="answer-revealed" *ngIf="showAnswer">
              <h3>الإجابة الصحيحة:</h3>
              <p class="correct-answer">{{ getCorrectAnswer() }}</p>
            </div>
          </div>

          <div class="play-cta">
            <h3>هل تريد اختبار معلوماتك أكثر؟</h3>
            <p>انضم إلى مسابقة الآن وتنافس مع لاعبين آخرين!</p>
            <a routerLink="/login" class="btn btn-primary">ابدأ اللعب</a>
          </div>

          <div class="related-section">
            <h3>أسئلة مشابهة</h3>
            <div class="related-links">
              <a 
                [routerLink]="['/questions', question.categorySlug]"
                class="related-link">
                المزيد من أسئلة {{ question.categoryNameAr }}
              </a>
              <a routerLink="/questions" class="related-link">
                جميع الأسئلة
              </a>
            </div>
          </div>

          <div class="share-section">
            <h3>شارك السؤال</h3>
            <div class="share-buttons">
              <a 
                [href]="getTwitterShareUrl()" 
                target="_blank" 
                rel="noopener"
                class="share-btn twitter">
                تويتر
              </a>
              <a 
                [href]="getWhatsAppShareUrl()" 
                target="_blank" 
                rel="noopener"
                class="share-btn whatsapp">
                واتساب
              </a>
              <button class="share-btn copy" (click)="copyLink()">
                {{ copySuccess ? 'تم النسخ!' : 'نسخ الرابط' }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  `,
  styles: [`
    .question-page {
      min-height: 100vh;
      background: var(--background);
      padding: 40px 20px;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    .breadcrumb {
      margin-bottom: 30px;
      font-size: 14px;
      color: var(--text-secondary);
      overflow-wrap: break-word;
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

    .loading, .error-state {
      text-align: center;
      padding: 60px 20px;
      background: var(--card-bg);
      border-radius: 16px;
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

    .error-state h2 {
      color: #e74c3c;
      margin-bottom: 15px;
    }

    .question-content {
      background: var(--card-bg);
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .question-header {
      display: flex;
      gap: 10px;
      margin-bottom: 25px;
      flex-wrap: wrap;
    }

    .category-badge {
      padding: 6px 14px;
      background: var(--primary);
      color: white;
      border-radius: 20px;
      font-size: 14px;
    }

    .difficulty-badge {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: bold;
    }

    .difficulty-badge.easy {
      background: #d4edda;
      color: #155724;
    }

    .difficulty-badge.medium {
      background: #fff3cd;
      color: #856404;
    }

    .difficulty-badge.hard {
      background: #f8d7da;
      color: #721c24;
    }

    h1.question-text {
      color: var(--text-primary);
      font-size: 1.8rem;
      line-height: 1.6;
      margin-bottom: 15px;
    }

    .question-text-en {
      color: var(--text-secondary);
      font-style: italic;
      direction: ltr;
      text-align: left;
      margin-bottom: 30px;
      padding: 15px;
      background: var(--background);
      border-radius: 8px;
    }

    .options-section {
      margin-bottom: 40px;
    }

    .options-section h2 {
      color: var(--text-primary);
      font-size: 1.3rem;
      margin-bottom: 20px;
    }

    .options-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .option-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px 20px;
      background: var(--background);
      border: 2px solid var(--border);
      border-radius: 10px;
      transition: all 0.3s;
    }

    .option-item.correct {
      background: #d4edda;
      border-color: #28a745;
    }

    .option-item.incorrect {
      opacity: 0.6;
    }

    .option-letter {
      width: 35px;
      height: 35px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary);
      color: white;
      border-radius: 50%;
      font-weight: bold;
    }

    .option-text {
      flex: 1;
      color: var(--text-primary);
    }

    .correct-badge {
      color: #28a745;
      font-weight: bold;
      font-size: 14px;
    }

    .show-answer-btn {
      width: 100%;
      margin-top: 20px;
      padding: 15px;
    }

    .answer-revealed {
      margin-top: 25px;
      padding: 20px;
      background: #d4edda;
      border-radius: 10px;
    }

    .answer-revealed h3 {
      color: #155724;
      margin-bottom: 10px;
    }

    .correct-answer {
      color: #155724;
      font-size: 1.2rem;
      font-weight: bold;
      margin: 0;
    }

    .play-cta {
      text-align: center;
      padding: 30px;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      border-radius: 12px;
      color: white;
      margin-bottom: 30px;
    }

    .play-cta h3 {
      margin-bottom: 10px;
    }

    .play-cta p {
      opacity: 0.9;
      margin-bottom: 20px;
    }

    .play-cta .btn {
      background: white;
      color: var(--primary);
    }

    .related-section, .share-section {
      margin-top: 30px;
      padding-top: 30px;
      border-top: 1px solid var(--border);
    }

    .related-section h3, .share-section h3 {
      color: var(--text-primary);
      margin-bottom: 15px;
    }

    .related-links {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    .related-link {
      padding: 10px 20px;
      background: var(--background);
      border-radius: 8px;
      color: var(--primary);
      text-decoration: none;
      transition: background 0.3s;
    }

    .related-link:hover {
      background: var(--border);
    }

    .share-buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .share-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
      font-size: 14px;
      transition: opacity 0.3s;
    }

    .share-btn:hover {
      opacity: 0.8;
    }

    .share-btn.twitter {
      background: #1da1f2;
      color: white;
    }

    .share-btn.whatsapp {
      background: #25d366;
      color: white;
    }

    .share-btn.copy {
      background: var(--border);
      color: var(--text-primary);
    }

    .btn {
      display: inline-block;
      padding: 12px 30px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
      font-size: 1rem;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    @media (max-width: 768px) {
      .question-content {
        padding: 25px;
      }

      h1.question-text {
        font-size: 1.4rem;
      }
    }
  `]
})
export class QuestionDetailComponent implements OnInit, OnDestroy {
  private readonly apiUrl = environment.apiUrl;
  private destroy$ = new Subject<void>();

  question: Question | null = null;
  loading = true;
  errorMessage = '';
  showAnswer = false;
  copySuccess = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private seoService: SeoService,
    private jsonLdService: JsonLdService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const categorySlug = params.get('category');
      const questionSlug = params.get('slug');
      
      if (categorySlug && questionSlug) {
        this.loadQuestion(categorySlug, questionSlug);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.jsonLdService.clearAllJsonLd();
  }

  loadQuestion(categorySlug: string, questionSlug: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<Question>(`${this.apiUrl}/questions/${categorySlug}/${questionSlug}`)
      .subscribe({
        next: (question) => {
          this.question = question;
          this.loading = false;
          this.updateSeo();
          this.setJsonLd();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = 'لم يتم العثور على السؤال المطلوب.';
          console.error('Error loading question:', err);
        }
      });
  }

  updateSeo(): void {
    if (!this.question) return;

    const title = this.question.textAr;
    const description = `جواب السؤال: ${this.question.textAr}. تنافس واكسب في سابق - منصة المسابقات التفاعلية.`;

    this.seoService.updateSeo({
      title,
      description,
      keywords: `سؤال, ${this.question.categoryNameAr}, كويز, سابق, مسابقات`,
      type: 'article',
      modifiedTime: this.question.lastModified,
      section: this.question.categoryNameAr
    });
  }

  setJsonLd(): void {
    if (!this.question) return;

    // Set question schema
    this.jsonLdService.setQuestionSchema(this.question);

    // Set breadcrumb schema
    this.jsonLdService.setBreadcrumbSchema([
      { name: 'الرئيسية', url: '/' },
      { name: 'الأسئلة', url: '/questions' },
      { name: this.question.categoryNameAr, url: `/questions/${this.question.categorySlug}` },
      { name: this.getTruncatedText(this.question.textAr, 50), url: `/questions/${this.question.categorySlug}/${this.question.slug}` }
    ]);
  }

  getTruncatedText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  getDifficultyLabel(difficulty: string): string {
    const labels: { [key: string]: string } = {
      'Easy': 'سهل',
      'Medium': 'متوسط',
      'Hard': 'صعب'
    };
    return labels[difficulty] || difficulty;
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }

  getCorrectAnswer(): string {
    if (!this.question) return '';
    const correct = this.question.options.find(o => o.isCorrect);
    return correct ? correct.textAr : '';
  }

  getTwitterShareUrl(): string {
    if (!this.question) return '';
    const text = encodeURIComponent(`${this.question.textAr} - جاوب على سابق!`);
    const url = encodeURIComponent(window.location.href);
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  }

  getWhatsAppShareUrl(): string {
    if (!this.question) return '';
    const text = encodeURIComponent(`${this.question.textAr}\n\nجاوب على: ${window.location.href}`);
    return `https://wa.me/?text=${text}`;
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.copySuccess = true;
      setTimeout(() => this.copySuccess = false, 2000);
    });
  }
}
