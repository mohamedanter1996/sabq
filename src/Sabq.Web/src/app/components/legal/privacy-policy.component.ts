import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';
import { JsonLdService } from '../../services/json-ld.service';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="legal-page">
      <div class="container">
        <nav class="breadcrumb" aria-label="breadcrumb">
          <a routerLink="/">الرئيسية</a>
          <span>›</span>
          <span>سياسة الخصوصية</span>
        </nav>

        <h1>سياسة الخصوصية</h1>
        <p class="last-updated">آخر تحديث: 15 فبراير 2026</p>

        <section>
          <h2>1. مقدمة</h2>
          <p>
            مرحباً بكم في سابق ("نحن"، "الشركة"، "المنصة"). نحن نلتزم بحماية خصوصيتكم وبياناتكم الشخصية. 
            توضح سياسة الخصوصية هذه كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتكم عند استخدام منصتنا.
          </p>
          <p class="english">
            Welcome to Sabq ("we", "Company", "Platform"). We are committed to protecting your privacy and personal data.
            This Privacy Policy explains how we collect, use, and protect your information when using our platform.
          </p>
        </section>

        <section>
          <h2>2. المعلومات التي نجمعها</h2>
          <h3>2.1 المعلومات التي تقدمها</h3>
          <ul>
            <li>اسم العرض الذي تختاره</li>
            <li>البريد الإلكتروني (في نموذج التواصل)</li>
            <li>الرسائل التي ترسلها عبر نموذج التواصل</li>
          </ul>

          <h3>2.2 المعلومات التي نجمعها تلقائياً</h3>
          <ul>
            <li>عنوان IP</li>
            <li>نوع المتصفح والجهاز</li>
            <li>صفحات الموقع التي تزورها</li>
            <li>وقت الزيارة ومدتها</li>
            <li>إحصائيات اللعب والنتائج</li>
          </ul>
        </section>

        <section>
          <h2>3. كيف نستخدم معلوماتك</h2>
          <ul>
            <li>تقديم خدمات المنصة وتحسينها</li>
            <li>إدارة حسابك وجلسات اللعب</li>
            <li>التواصل معك بشأن استفساراتك</li>
            <li>تحليل استخدام المنصة لتحسين التجربة</li>
            <li>حماية المنصة من الاستخدام غير المصرح به</li>
          </ul>
        </section>

        <section>
          <h2>4. مشاركة المعلومات</h2>
          <p>
            لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك في الحالات التالية:
          </p>
          <ul>
            <li>مع مقدمي الخدمات الذين يساعدوننا في تشغيل المنصة</li>
            <li>عند الضرورة للامتثال للقانون</li>
            <li>لحماية حقوقنا أو سلامة المستخدمين</li>
          </ul>
        </section>

        <section>
          <h2>5. ملفات تعريف الارتباط (Cookies)</h2>
          <p>
            نستخدم ملفات تعريف الارتباط لتحسين تجربتك على المنصة. يمكنك التحكم في إعدادات ملفات تعريف الارتباط
            من خلال متصفحك.
          </p>
        </section>

        <section>
          <h2>6. أمان البيانات</h2>
          <p>
            نتخذ إجراءات أمنية مناسبة لحماية معلوماتك من الوصول غير المصرح به أو التعديل أو الإفصاح أو الإتلاف.
          </p>
        </section>

        <section>
          <h2>7. حقوقك</h2>
          <p>لديك الحق في:</p>
          <ul>
            <li>الوصول إلى بياناتك الشخصية</li>
            <li>تصحيح بياناتك غير الدقيقة</li>
            <li>طلب حذف بياناتك</li>
            <li>الاعتراض على معالجة بياناتك</li>
          </ul>
        </section>

        <section>
          <h2>8. التغييرات على هذه السياسة</h2>
          <p>
            قد نحدث سياسة الخصوصية هذه من وقت لآخر. سننشر أي تغييرات على هذه الصفحة مع تحديث تاريخ "آخر تحديث".
          </p>
        </section>

        <section>
          <h2>9. اتصل بنا</h2>
          <p>
            إذا كانت لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى التواصل معنا عبر:
          </p>
          <ul>
            <li>البريد الإلكتروني: <a href="mailto:privacy&#64;sabq.com">privacy&#64;sabq.com</a></li>
            <li><a routerLink="/contact">صفحة التواصل</a></li>
          </ul>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .legal-page {
      min-height: 100vh;
      background: var(--background);
      padding: 40px 20px;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      background: var(--card-bg);
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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
      margin-bottom: 10px;
      text-align: center;
    }

    .last-updated {
      text-align: center;
      color: var(--text-secondary);
      margin-bottom: 40px;
      font-size: 14px;
    }

    section {
      margin-bottom: 30px;
    }

    h2 {
      color: var(--text-primary);
      font-size: 1.5rem;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid var(--primary);
    }

    h3 {
      color: var(--text-primary);
      font-size: 1.2rem;
      margin: 15px 0 10px;
    }

    p {
      color: var(--text-secondary);
      line-height: 1.8;
      margin-bottom: 15px;
    }

    .english {
      font-style: italic;
      direction: ltr;
      text-align: left;
      background: var(--background);
      padding: 15px;
      border-radius: 8px;
      margin-top: 10px;
    }

    ul {
      list-style-type: disc;
      padding-right: 30px;
      margin-bottom: 15px;
    }

    li {
      color: var(--text-secondary);
      line-height: 1.8;
      margin-bottom: 8px;
    }

    a {
      color: var(--primary);
    }

    @media (max-width: 768px) {
      .container {
        padding: 20px;
      }

      h1 {
        font-size: 1.8rem;
      }

      h2 {
        font-size: 1.3rem;
      }
    }
  `]
})
export class PrivacyPolicyComponent implements OnInit {
  constructor(
    private seoService: SeoService,
    private jsonLdService: JsonLdService
  ) {}

  ngOnInit(): void {
    this.seoService.updateSeo({
      title: 'سياسة الخصوصية',
      description: 'سياسة الخصوصية لمنصة سابق. اقرأ كيف نجمع ونستخدم ونحمي معلوماتك الشخصية.',
      keywords: 'سياسة الخصوصية, سابق, حماية البيانات, الخصوصية',
      type: 'website'
    });

    this.jsonLdService.setBreadcrumbSchema([
      { name: 'الرئيسية', url: '/' },
      { name: 'سياسة الخصوصية', url: '/privacy-policy' }
    ]);

    this.jsonLdService.setWebPageSchema(
      'سياسة الخصوصية | سابق',
      'سياسة الخصوصية لمنصة سابق للمسابقات التفاعلية',
      '/privacy-policy'
    );
  }
}
