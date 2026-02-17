import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SeoService } from '../../services/seo.service';
import { JsonLdService } from '../../services/json-ld.service';
import { environment } from '../../../environments/environment';

interface ContactResponse {
  success: boolean;
  messageAr: string;
  messageEn: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="contact-page">
      <div class="container">
        <nav class="breadcrumb" aria-label="breadcrumb">
          <a routerLink="/">الرئيسية</a>
          <span>›</span>
          <span>تواصل معنا</span>
        </nav>

        <h1>تواصل معنا</h1>
        <p class="subtitle">نحب أن نسمع منك! أرسل لنا رسالتك وسنرد عليك في أقرب وقت.</p>

        <div class="content-grid">
          <div class="contact-form-container">
            <h2>أرسل رسالة</h2>
            
            <form (ngSubmit)="submitForm()" #contactForm="ngForm">
              <div class="form-group">
                <label for="name">الاسم *</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name"
                  [(ngModel)]="formData.name"
                  required
                  minlength="2"
                  maxlength="100"
                  placeholder="أدخل اسمك"
                  #nameInput="ngModel">
                <div class="error" *ngIf="nameInput.invalid && nameInput.touched">
                  <span *ngIf="nameInput.errors?.['required']">الاسم مطلوب</span>
                  <span *ngIf="nameInput.errors?.['minlength']">الاسم يجب أن يكون حرفين على الأقل</span>
                </div>
              </div>

              <div class="form-group">
                <label for="email">البريد الإلكتروني *</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  [(ngModel)]="formData.email"
                  required
                  email
                  maxlength="200"
                  placeholder="example&#64;email.com"
                  #emailInput="ngModel">
                <div class="error" *ngIf="emailInput.invalid && emailInput.touched">
                  <span *ngIf="emailInput.errors?.['required']">البريد الإلكتروني مطلوب</span>
                  <span *ngIf="emailInput.errors?.['email']">البريد الإلكتروني غير صالح</span>
                </div>
              </div>

              <div class="form-group">
                <label for="message">الرسالة *</label>
                <textarea 
                  id="message" 
                  name="message"
                  [(ngModel)]="formData.message"
                  required
                  minlength="10"
                  maxlength="2000"
                  rows="6"
                  placeholder="اكتب رسالتك هنا..."
                  #messageInput="ngModel"></textarea>
                <div class="char-count">{{ formData.message.length }} / 2000</div>
                <div class="error" *ngIf="messageInput.invalid && messageInput.touched">
                  <span *ngIf="messageInput.errors?.['required']">الرسالة مطلوبة</span>
                  <span *ngIf="messageInput.errors?.['minlength']">الرسالة يجب أن تكون 10 أحرف على الأقل</span>
                </div>
              </div>

              <div class="success-message" *ngIf="successMessage">
                {{ successMessage }}
              </div>

              <div class="error-message" *ngIf="errorMessage">
                {{ errorMessage }}
              </div>

              <button 
                type="submit" 
                class="btn btn-primary"
                [disabled]="contactForm.invalid || loading">
                <span *ngIf="!loading">إرسال الرسالة</span>
                <span *ngIf="loading">جاري الإرسال...</span>
              </button>
            </form>
          </div>

          <div class="contact-info">
            <h2>معلومات التواصل</h2>
            
            <div class="info-card">
              <div class="info-icon">📧</div>
              <div class="info-content">
                <h3>البريد الإلكتروني</h3>
                <a href="mailto:support&#64;sabq.com">support&#64;sabq.com</a>
              </div>
            </div>

            <div class="info-card">
              <div class="info-icon">🌐</div>
              <div class="info-content">
                <h3>الموقع الإلكتروني</h3>
                <a href="https://sabq.com" target="_blank">sabq.com</a>
              </div>
            </div>

            <div class="info-card">
              <div class="info-icon">📱</div>
              <div class="info-content">
                <h3>وسائل التواصل الاجتماعي</h3>
                <div class="social-links">
                  <a href="https://twitter.com/sabq_quiz" target="_blank" rel="noopener" class="social-btn twitter" aria-label="تويتر">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                  <a href="https://facebook.com/sabqquiz" target="_blank" rel="noopener" class="social-btn facebook" aria-label="فيسبوك">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="https://instagram.com/sabq_quiz" target="_blank" rel="noopener" class="social-btn instagram" aria-label="إنستغرام">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                  <a href="https://youtube.com/@sabq_quiz" target="_blank" rel="noopener" class="social-btn youtube" aria-label="يوتيوب">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                </div>
              </div>
            </div>

            <div class="response-time">
              <h3>وقت الرد المتوقع</h3>
              <p>نسعى للرد على جميع الرسائل خلال 24-48 ساعة عمل.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contact-page {
      min-height: 100vh;
      background: var(--background);
      padding: 40px 20px;
    }

    .container {
      max-width: 1000px;
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
      color: var(--primary);
      font-size: 2.5rem;
      text-align: center;
      margin-bottom: 15px;
    }

    .subtitle {
      text-align: center;
      color: var(--text-secondary);
      font-size: 1.2rem;
      margin-bottom: 40px;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }

    .contact-form-container, .contact-info {
      background: var(--card-bg);
      padding: 35px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    h2 {
      color: var(--text-primary);
      font-size: 1.5rem;
      margin-bottom: 25px;
      padding-bottom: 10px;
      border-bottom: 3px solid var(--primary);
      display: inline-block;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      color: var(--text-primary);
      margin-bottom: 8px;
      font-weight: 500;
    }

    input, textarea {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid var(--border);
      border-radius: 8px;
      font-size: 1rem;
      background: var(--background);
      color: var(--text-primary);
      transition: border-color 0.3s;
    }

    input:focus, textarea:focus {
      outline: none;
      border-color: var(--primary);
    }

    textarea {
      resize: vertical;
      min-height: 120px;
    }

    .char-count {
      text-align: left;
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 5px;
    }

    .error {
      color: #e74c3c;
      font-size: 13px;
      margin-top: 5px;
    }

    .success-message {
      background: #d4edda;
      color: #155724;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
    }

    .error-message {
      background: #f8d7da;
      color: #721c24;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
    }

    .btn {
      width: 100%;
      padding: 15px;
      font-size: 1.1rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.3s;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--secondary);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .info-card {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      padding: 20px;
      background: var(--background);
      border-radius: 12px;
      margin-bottom: 15px;
    }

    .info-icon {
      font-size: 2rem;
    }

    .info-content h3 {
      color: var(--text-primary);
      margin-bottom: 5px;
      font-size: 1rem;
    }

    .info-content a {
      color: var(--primary);
      text-decoration: none;
    }

    .info-content a:hover {
      text-decoration: underline;
    }

    .social-links {
      display: flex;
      gap: 12px;
      margin-top: 10px;
    }

    .social-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      color: white;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .social-btn svg {
      width: 22px;
      height: 22px;
    }

    .social-btn:hover {
      transform: translateY(-3px) scale(1.05);
    }

    .social-btn.twitter {
      background: linear-gradient(135deg, #1DA1F2, #0d8bd9);
      box-shadow: 0 4px 15px rgba(29, 161, 242, 0.4);
    }

    .social-btn.twitter:hover {
      box-shadow: 0 8px 25px rgba(29, 161, 242, 0.5);
    }

    .social-btn.facebook {
      background: linear-gradient(135deg, #1877F2, #0d5fc7);
      box-shadow: 0 4px 15px rgba(24, 119, 242, 0.4);
    }

    .social-btn.facebook:hover {
      box-shadow: 0 8px 25px rgba(24, 119, 242, 0.5);
    }

    .social-btn.instagram {
      background: linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4);
      box-shadow: 0 4px 15px rgba(221, 42, 123, 0.4);
    }

    .social-btn.instagram:hover {
      box-shadow: 0 8px 25px rgba(221, 42, 123, 0.5);
    }

    .social-btn.youtube {
      background: linear-gradient(135deg, #FF0000, #CC0000);
      box-shadow: 0 4px 15px rgba(255, 0, 0, 0.4);
    }

    .social-btn.youtube:hover {
      box-shadow: 0 8px 25px rgba(255, 0, 0, 0.5);
    }

    .response-time {
      margin-top: 30px;
      padding: 20px;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      border-radius: 12px;
      color: white;
    }

    .response-time h3 {
      margin-bottom: 10px;
    }

    .response-time p {
      opacity: 0.95;
      margin: 0;
    }

    @media (max-width: 768px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      h1 {
        font-size: 1.8rem;
      }

      .contact-form-container, .contact-info {
        padding: 25px;
      }
    }
  `]
})
export class ContactComponent implements OnInit {
  private readonly apiUrl = environment.apiUrl;

  formData = {
    name: '',
    email: '',
    message: ''
  };

  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private seoService: SeoService,
    private jsonLdService: JsonLdService
  ) {}

  ngOnInit(): void {
    this.seoService.updateSeo({
      title: 'تواصل معنا',
      description: 'تواصل مع فريق سابق. أرسل لنا استفساراتك واقتراحاتك وسنرد عليك في أقرب وقت.',
      keywords: 'تواصل, اتصل بنا, سابق, دعم, مساعدة',
      type: 'website'
    });

    this.jsonLdService.setBreadcrumbSchema([
      { name: 'الرئيسية', url: '/' },
      { name: 'تواصل معنا', url: '/contact' }
    ]);

    this.jsonLdService.setWebPageSchema(
      'تواصل معنا | سابق',
      'تواصل مع فريق سابق للمسابقات التفاعلية',
      '/contact'
    );
  }

  submitForm(): void {
    if (this.loading) return;

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.http.post<ContactResponse>(`${this.apiUrl}/contact`, this.formData)
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.successMessage = response.messageAr;
            this.formData = { name: '', email: '', message: '' };
          } else {
            this.errorMessage = response.messageAr;
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.messageAr || 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.';
        }
      });
  }
}
