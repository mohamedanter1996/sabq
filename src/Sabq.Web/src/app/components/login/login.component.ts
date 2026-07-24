import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';
import { JsonLdService } from '../../services/json-ld.service';

interface GuestLoginResponse { token: string; playerId: string; displayName: string; }

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="landing-shell" aria-labelledby="main-title">
      <div class="hero-copy">
        <p class="eyebrow">لعبة أسئلة جماعية مباشرة</p>
        <h1 id="main-title">سابق</h1>
        <p class="tagline">جاوب الأول... واكسب</p>
        <p class="intro">
          سابق لعبة مسابقات تفاعلية تجمع المنافسة السريعة مع اكتساب معلومات جديدة من خلال اللعب.
          أنشئ غرفة، شارك الرمز مع أصدقائك، وادخل تحدي كويز عربي ممتع في الوقت الحقيقي.
        </p>

        <div class="topic-strip" aria-label="موضوعات سابق">
          <span>ألعاب جماعية تفاعلية</span>
          <span>مسابقات كويز مباشرة</span>
          <span>تحدي بين الأصدقاء</span>
          <span>تعلم باللعب</span>
        </div>

        <div class="quick-links" aria-label="روابط مهمة">
          <a routerLink="/learn">استكشف تحديات التعلّم</a>
          <a routerLink="/about">عن سابق</a>
        </div>
      </div>

      <form class="start-panel" (ngSubmit)="login()" novalidate>
        <img src="assets/logo.svg" alt="شعار سابق" class="brand-mark">
        <h2>ابدأ اللعب الآن</h2>
        <p>اكتب اسمك وادخل إلى غرف المسابقات الجماعية.</p>

        <label for="displayName">اسم اللاعب</label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          [(ngModel)]="displayName"
          placeholder="مثال: محمود"
          autocomplete="nickname">

        <p *ngIf="errorMessage" class="error">{{ errorMessage }}</p>

        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="loading">
          {{ loading ? 'جاري الدخول...' : 'دخول اللعبة' }}
        </button>

        <div *ngIf="loading" class="spinner"></div>
      </form>
    </section>

    <section class="seo-content" aria-labelledby="seo-heading">
      <h2 id="seo-heading">مسابقات تفاعلية تجمع اللعب والمعرفة</h2>
      <p>
        صممت سابق لعشاق الألعاب الجماعية والمسابقات السريعة: أسئلة متنوعة، غرف لعب فورية،
        منافسة مباشرة، وتجربة عربية تساعدك على اكتساب معلومات جديدة بطريقة خفيفة وممتعة.
      </p>

      <div class="benefit-grid">
        <div>
          <h3>منافسة جماعية</h3>
          <p>العب مع الأصدقاء أو العائلة في غرف مباشرة تعتمد على سرعة الإجابة ودقة الاختيار.</p>
        </div>
        <div>
          <h3>معلومات جديدة</h3>
          <p>اختبر معلوماتك في أسئلة ثقافية وتعليمية مناسبة لجلسات اللعب القصيرة والطويلة.</p>
        </div>
        <div>
          <h3>لعب عربي سريع</h3>
          <p>واجهة عربية سهلة، رموز غرف بسيطة، وتحديات كويز يمكن بدءها خلال لحظات.</p>
        </div>
      </div>

      <div class="faq-list" aria-label="أسئلة شائعة">
        <article>
          <h3>ما هي لعبة سابق؟</h3>
          <p>سابق لعبة أسئلة جماعية تفاعلية تتيح إنشاء غرف مسابقات مباشرة بين اللاعبين.</p>
        </article>
        <article>
          <h3>هل تساعد سابق على اكتساب معلومات؟</h3>
          <p>نعم، تعتمد اللعبة على أسئلة متنوعة تجعل التعلم جزءا طبيعيا من المنافسة واللعب.</p>
        </article>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }

    .landing-shell {
      max-width: 1180px;
      margin: 0 auto;
      padding: 4rem 1.5rem 3rem;
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(320px, 420px);
      gap: 2.5rem;
      align-items: center;
    }

    .hero-copy {
      min-width: 0;
    }

    .eyebrow {
      color: var(--accent);
      font-weight: 800;
      margin-bottom: 0.75rem;
    }

    h1 {
      color: var(--primary);
      font-family: 'Aref Ruqaa', 'Cairo', serif;
      font-size: clamp(3.5rem, 10vw, 6.5rem);
      line-height: 1;
      margin: 0;
    }

    .tagline {
      color: var(--secondary);
      font-size: 1.75rem;
      font-weight: 800;
      margin: 0.75rem 0 1rem;
    }

    .intro {
      color: var(--text-primary);
      font-size: 1.08rem;
      line-height: 1.9;
      max-width: 680px;
      margin: 0;
    }

    .topic-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin: 1.75rem 0;
    }

    .topic-strip span {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #047857;
      border-radius: 999px;
      padding: 0.55rem 0.9rem;
      font-size: 0.92rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .quick-links {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .quick-links a {
      color: var(--primary);
      font-weight: 800;
      text-decoration: none;
      border-bottom: 2px solid rgba(30, 58, 138, 0.25);
      padding-bottom: 0.2rem;
    }

    .quick-links a:hover {
      border-color: var(--secondary);
    }

    .start-panel {
      background: var(--surface);
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
    }

    .brand-mark {
      display: block;
      width: 82px;
      height: 82px;
      margin: 0 auto 1.25rem;
    }

    .start-panel h2 {
      color: var(--primary);
      text-align: center;
      font-size: 1.8rem;
      margin: 0 0 0.5rem;
    }

    .start-panel p {
      color: var(--text-secondary);
      text-align: center;
      line-height: 1.7;
      margin: 0 0 1.5rem;
    }

    label {
      display: block;
      color: var(--text-primary);
      font-weight: 800;
      margin-bottom: 0.5rem;
    }

    input {
      margin-bottom: 1rem;
    }

    button {
      width: 100%;
      min-height: 48px;
      margin-top: 0.25rem;
    }

    .error {
      text-align: right;
      margin: -0.25rem 0 1rem;
    }

    .seo-content {
      max-width: 1180px;
      margin: 0 auto;
      padding: 1rem 1.5rem 4rem;
    }

    .seo-content h2 {
      color: var(--primary);
      font-size: 2rem;
      margin-bottom: 0.75rem;
    }

    .seo-content > p {
      color: var(--text-secondary);
      line-height: 1.9;
      max-width: 880px;
      margin: 0 0 1.5rem;
    }

    .benefit-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .benefit-grid > div,
    .faq-list article {
      border-top: 3px solid var(--accent);
      background: #ffffff;
      border-radius: 8px;
      padding: 1.25rem;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
    }

    .benefit-grid h3,
    .faq-list h3 {
      color: var(--text-primary);
      font-size: 1.1rem;
      margin: 0 0 0.5rem;
    }

    .benefit-grid p,
    .faq-list p {
      color: var(--text-secondary);
      line-height: 1.75;
      margin: 0;
    }

    .faq-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    @media (max-width: 900px) {
      .landing-shell {
        grid-template-columns: 1fr;
        padding-top: 2.5rem;
      }

      .start-panel {
        max-width: 520px;
        width: 100%;
        margin: 0 auto;
      }

      .benefit-grid,
      .faq-list {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 520px) {
      .landing-shell,
      .seo-content {
        padding-left: 1rem;
        padding-right: 1rem;
      }

      .tagline {
        font-size: 1.35rem;
      }

      .topic-strip span {
        white-space: normal;
      }

      .start-panel {
        padding: 1.25rem;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  displayName = '';
  loading = false;
  errorMessage = '';

  private readonly pageDescription = 'سابق لعبة أسئلة جماعية تفاعلية للمنافسة بين الأصدقاء. العب مسابقات كويز مباشرة، تحدى اللاعبين، واكتسب معلومات جديدة بطريقة ممتعة.';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private seoService: SeoService,
    private jsonLdService: JsonLdService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.seoService.updateSeo({
      title: 'لعبة أسئلة جماعية تفاعلية',
      description: this.pageDescription,
      keywords: 'سابق, لعبة أسئلة, ألعاب جماعية, مسابقات تفاعلية, كويز عربي, تحدي معلومات, تعلم باللعب, ألعاب تعليمية, لعبة جماعية مباشرة',
      image: 'https://sabiqgame.com/assets/og-image.svg',
      url: 'https://sabiqgame.com/',
      type: 'website',
      locale: 'ar_EG'
    });

    this.jsonLdService.setOrganizationSchema();
    this.jsonLdService.setWebsiteSchema();
    this.jsonLdService.setGameApplicationSchema();
    this.jsonLdService.setWebPageSchema('سابق - لعبة أسئلة جماعية تفاعلية', this.pageDescription, '/');
    this.jsonLdService.setFAQSchema([
      {
        question: 'ما هي لعبة سابق؟',
        answer: 'سابق لعبة أسئلة جماعية تفاعلية تتيح إنشاء غرف مسابقات مباشرة بين اللاعبين.'
      },
      {
        question: 'هل تساعد سابق على اكتساب معلومات؟',
        answer: 'نعم، تعتمد اللعبة على أسئلة متنوعة تجعل التعلم جزءا طبيعيا من المنافسة واللعب.'
      }
    ]);
  }

  login(): void {
    if (!this.displayName.trim()) {
      this.errorMessage = 'الرجاء إدخال اسم اللاعب';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.apiService.guestLogin(this.displayName.trim()).subscribe({
      next: (response: GuestLoginResponse) => {
        this.authService.setAuth(response.playerId, response.displayName, response.token);
        this.router.navigate(['/home']);
      },
      error: () => {
        this.errorMessage = 'فشل تسجيل الدخول';
        this.loading = false;
      }
    });
  }
}
