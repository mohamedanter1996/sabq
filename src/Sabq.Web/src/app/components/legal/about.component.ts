import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';
import { JsonLdService } from '../../services/json-ld.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="about-page">
      <div class="container">
        <nav class="breadcrumb" aria-label="breadcrumb">
          <a routerLink="/">الرئيسية</a>
          <span>›</span>
          <span>من نحن</span>
        </nav>

        <header class="hero">
          <h1>سابق</h1>
          <p class="tagline">جاوب الأول… واكسب!</p>
          <p class="english-tagline">Answer First... and Win!</p>
        </header>

        <section class="intro">
          <h2>عن المنصة</h2>
          <p>
            سابق هي منصة مسابقات تفاعلية متعددة اللاعبين تجمع بين المتعة والتعلم. 
            انطلقت المنصة بهدف تقديم تجربة تنافسية ممتعة تثري المعرفة وتحفز على التعلم المستمر.
          </p>
          <p class="english">
            Sabq is an interactive multiplayer quiz platform that combines fun and learning.
            The platform was launched with the goal of providing an enjoyable competitive experience
            that enriches knowledge and encourages continuous learning.
          </p>
        </section>

        <section class="features">
          <h2>مميزات المنصة</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🎮</div>
              <h3>لعب جماعي</h3>
              <p>أنشئ غرفة وشارك رمزها مع أصدقائك للتنافس في وقت واحد</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📚</div>
              <h3>تصنيفات متعددة</h3>
              <p>أسئلة في مختلف المجالات: دينية، ثقافية، علمية، رياضية، وأكثر</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">⚡</div>
              <h3>سرعة الاستجابة</h3>
              <p>كن الأسرع في الإجابة واحصل على نقاط إضافية</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🏆</div>
              <h3>تتبع الإنجازات</h3>
              <p>تابع تقدمك وسجل انتصاراتك في سجل اللعب</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔐</div>
              <h3>غرف خاصة</h3>
              <p>أنشئ غرفتك الخاصة وادعُ من تريد للمنافسة</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📱</div>
              <h3>متاح للجميع</h3>
              <p>استخدم المنصة من متصفح حديث على الهاتف أو الكمبيوتر</p>
            </div>
          </div>
        </section>

        <section class="mission">
          <h2>رسالتنا</h2>
          <p>
            نسعى لجعل التعلم ممتعاً وتفاعلياً. نؤمن بأن المنافسة الصحية تحفز على اكتساب المعرفة
            وتطوير المهارات. هدفنا هو بناء مجتمع من المتعلمين المتحمسين الذين يستمتعون بتوسيع آفاقهم.
          </p>
        </section>

        <section class="sources">
          <h2>تحرير الأسئلة ومصادرها</h2>
          <p>
            نوضح معايير اختيار الأسئلة ومراجعة الإجابات والمصادر في سياسة التحرير. نرحب بالبلاغات التي تساعدنا على تصحيح خطأ أو تحديث معلومة.
          </p>
          <a routerLink="/editorial-policy" class="text-link">اطّلع على سياسة التحرير والمصادر</a>
        </section>

        <section class="content-standards">
          <h2>الشفافية والتصحيحات</h2>
          <p>
            لا ننشر أرقامًا تسويقية غير موثقة عن عدد المستخدمين أو المسابقات. نركز بدلًا من ذلك على وضوح تجربة اللعب، ومراجعة المحتوى، وإتاحة طريق واضح للإبلاغ عن الأخطاء.
          </p>
          <div class="standards-links">
            <a routerLink="/corrections" class="text-link">سياسة التصحيحات</a>
            <a routerLink="/team" class="text-link">من يقف وراء المنصة</a>
          </div>
        </section>

        <section class="faq">
          <h2>الأسئلة الشائعة</h2>
          <div class="faq-list">
            <div class="faq-item">
              <h3>هل المنصة مجانية؟</h3>
              <p>نعم، المنصة مجانية بالكامل للاستخدام الأساسي.</p>
            </div>
            <div class="faq-item">
              <h3>كيف أبدأ اللعب؟</h3>
              <p>أدخل اسم المستخدم الخاص بك وانضم إلى غرفة موجودة أو أنشئ غرفتك الخاصة.</p>
            </div>
            <div class="faq-item">
              <h3>هل يمكنني اللعب مع أصدقائي؟</h3>
              <p>بالتأكيد! أنشئ غرفة خاصة وشارك رمز الغرفة مع أصدقائك.</p>
            </div>
            <div class="faq-item">
              <h3>ما هي اللغات المدعومة؟</h3>
              <p>المنصة متاحة باللغتين العربية والإنجليزية.</p>
            </div>
          </div>
        </section>

        <section class="contact-cta">
          <h2>تواصل معنا</h2>
          <p>هل لديك سؤال أو اقتراح؟ نحب أن نسمع منك!</p>
          <a routerLink="/contact" class="btn btn-primary">تواصل معنا</a>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .about-page {
      min-height: 100vh;
      background: var(--background);
      padding: 40px 20px;
    }

    .container {
      max-width: 900px;
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

    .hero {
      text-align: center;
      padding: 60px 20px;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      border-radius: 20px;
      margin-bottom: 40px;
      color: white;
    }

    .hero h1 {
      font-size: 4rem;
      margin-bottom: 10px;
    }

    .tagline {
      font-size: 1.8rem;
      opacity: 0.95;
    }

    .english-tagline {
      font-size: 1.2rem;
      opacity: 0.8;
      font-style: italic;
    }

    section {
      background: var(--card-bg);
      padding: 40px;
      border-radius: 16px;
      margin-bottom: 30px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    h2 {
      color: var(--primary);
      font-size: 1.8rem;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid var(--primary);
      display: inline-block;
    }

    p {
      color: var(--text-secondary);
      line-height: 1.8;
      margin-bottom: 15px;
      font-size: 1.1rem;
    }

    .english {
      font-style: italic;
      direction: ltr;
      text-align: left;
      background: var(--background);
      padding: 15px;
      border-radius: 8px;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }

    .feature-card {
      background: var(--background);
      padding: 25px;
      border-radius: 12px;
      text-align: center;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .feature-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .feature-icon {
      font-size: 3rem;
      margin-bottom: 15px;
    }

    .feature-card h3 {
      color: var(--text-primary);
      margin-bottom: 10px;
    }

    .feature-card p {
      font-size: 0.95rem;
      margin-bottom: 0;
    }

    .text-link {
      color: var(--primary);
      font-weight: 700;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .standards-links {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }

    .stat-card {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      color: white;
    }

    .stat-number {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .stat-label {
      font-size: 1rem;
      opacity: 0.9;
    }

    .faq-list {
      margin-top: 20px;
    }

    .faq-item {
      background: var(--background);
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 15px;
    }

    .faq-item h3 {
      color: var(--text-primary);
      margin-bottom: 10px;
      font-size: 1.1rem;
    }

    .faq-item p {
      margin-bottom: 0;
      font-size: 1rem;
    }

    .contact-cta {
      text-align: center;
    }

    .btn {
      display: inline-block;
      padding: 15px 40px;
      font-size: 1.1rem;
      border-radius: 8px;
      text-decoration: none;
      margin-top: 20px;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
      transition: background 0.3s;
    }

    .btn-primary:hover {
      background: var(--secondary);
    }

    @media (max-width: 768px) {
      .hero h1 {
        font-size: 2.5rem;
      }

      .tagline {
        font-size: 1.3rem;
      }

      section {
        padding: 25px;
      }

      h2 {
        font-size: 1.4rem;
      }

      .stat-number {
        font-size: 1.8rem;
      }
    }
  `]
})
export class AboutComponent implements OnInit {
  constructor(
    private seoService: SeoService,
    private jsonLdService: JsonLdService
  ) {}

  ngOnInit(): void {
    this.seoService.updateSeo({
      title: 'من نحن',
      description: 'تعرف على منصة سابق للمسابقات التفاعلية. منصة عربية للمسابقات الجماعية الممتعة والتعليمية.',
      keywords: 'سابق, من نحن, مسابقات, ألعاب تعليمية, كويز',
      type: 'website'
    });

    this.jsonLdService.setBreadcrumbSchema([
      { name: 'الرئيسية', url: '/' },
      { name: 'من نحن', url: '/about' }
    ]);

    this.jsonLdService.setOrganizationSchema();

    this.jsonLdService.setFAQSchema([
      {
        question: 'هل منصة سابق مجانية؟',
        answer: 'نعم، المنصة مجانية بالكامل للاستخدام الأساسي.'
      },
      {
        question: 'كيف أبدأ اللعب في سابق؟',
        answer: 'أدخل اسم المستخدم الخاص بك وانضم إلى غرفة موجودة أو أنشئ غرفتك الخاصة.'
      },
      {
        question: 'هل يمكنني اللعب مع أصدقائي؟',
        answer: 'بالتأكيد! أنشئ غرفة خاصة وشارك رمز الغرفة مع أصدقائك.'
      },
      {
        question: 'ما هي اللغات المدعومة في سابق؟',
        answer: 'المنصة متاحة باللغتين العربية والإنجليزية.'
      }
    ]);
  }
}
