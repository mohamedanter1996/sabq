import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';
import { JsonLdService } from '../../services/json-ld.service';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="legal-page">
      <div class="container">
        <nav class="breadcrumb" aria-label="breadcrumb">
          <a routerLink="/">الرئيسية</a>
          <span>›</span>
          <span>الشروط والأحكام</span>
        </nav>

        <h1>الشروط والأحكام</h1>
        <p class="last-updated">آخر تحديث: 15 فبراير 2026</p>

        <section>
          <h2>1. قبول الشروط</h2>
          <p>
            باستخدامك لمنصة سابق، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي
            من هذه الشروط، فيرجى عدم استخدام المنصة.
          </p>
          <p class="english">
            By using the Sabq platform, you agree to be bound by these Terms and Conditions. If you do not agree
            to any of these terms, please do not use the platform.
          </p>
        </section>

        <section>
          <h2>2. وصف الخدمة</h2>
          <p>
            سابق هي منصة مسابقات تفاعلية متعددة اللاعبين تتيح للمستخدمين:
          </p>
          <ul>
            <li>المشاركة في مسابقات الأسئلة والأجوبة</li>
            <li>التنافس مع لاعبين آخرين في الوقت الفعلي</li>
            <li>إنشاء غرف مسابقات خاصة</li>
            <li>تتبع الإنجازات والنتائج</li>
          </ul>
        </section>

        <section>
          <h2>3. التسجيل والحساب</h2>
          <ul>
            <li>يمكنك استخدام المنصة كضيف باسم عرض</li>
            <li>أنت مسؤول عن الحفاظ على سرية معلومات حسابك</li>
            <li>يجب أن يكون اسم العرض مناسباً ولا يحتوي على محتوى مسيء</li>
            <li>يحق لنا تعليق أو إلغاء حسابك في حالة انتهاك هذه الشروط</li>
          </ul>
        </section>

        <section>
          <h2>4. قواعد السلوك</h2>
          <p>عند استخدام المنصة، يُحظر عليك:</p>
          <ul>
            <li>استخدام لغة مسيئة أو غير لائقة</li>
            <li>محاولة الغش أو التلاعب بالنتائج</li>
            <li>إزعاج أو مضايقة المستخدمين الآخرين</li>
            <li>نشر محتوى غير قانوني أو ضار</li>
            <li>محاولة اختراق أو تعطيل المنصة</li>
            <li>استخدام برامج آلية (bots) للعب</li>
          </ul>
        </section>

        <section>
          <h2>5. الملكية الفكرية</h2>
          <p>
            جميع المحتويات على المنصة، بما في ذلك النصوص والأسئلة والرسومات والشعارات، هي ملك لسابق
            أو مرخصة لها. لا يجوز نسخ أو توزيع أي محتوى دون إذن كتابي مسبق.
          </p>
        </section>

        <section>
          <h2>6. إخلاء المسؤولية</h2>
          <p>
            تُقدم المنصة "كما هي" دون أي ضمانات صريحة أو ضمنية. لا نضمن أن المنصة ستكون متاحة
            دائماً أو خالية من الأخطاء.
          </p>
        </section>

        <section>
          <h2>7. تحديد المسؤولية</h2>
          <p>
            لن تكون سابق مسؤولة عن أي أضرار مباشرة أو غير مباشرة أو عرضية أو تبعية ناتجة عن
            استخدام المنصة أو عدم القدرة على استخدامها.
          </p>
        </section>

        <section>
          <h2>8. التعديلات</h2>
          <p>
            نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم نشر التغييرات على هذه الصفحة
            مع تحديث تاريخ "آخر تحديث". استمرارك في استخدام المنصة بعد التعديلات يعني موافقتك عليها.
          </p>
        </section>

        <section>
          <h2>9. القانون الحاكم</h2>
          <p>
            تخضع هذه الشروط والأحكام لقوانين المملكة العربية السعودية وتُفسر وفقاً لها.
          </p>
        </section>

        <section>
          <h2>10. اتصل بنا</h2>
          <p>
            لأي استفسارات حول هذه الشروط والأحكام:
          </p>
          <ul>
            <li>البريد الإلكتروني: <a href="mailto:legal&#64;sabq.com">legal&#64;sabq.com</a></li>
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
export class TermsComponent implements OnInit {
  constructor(
    private seoService: SeoService,
    private jsonLdService: JsonLdService
  ) {}

  ngOnInit(): void {
    this.seoService.updateSeo({
      title: 'الشروط والأحكام',
      description: 'الشروط والأحكام لاستخدام منصة سابق للمسابقات التفاعلية. اقرأ شروط الاستخدام والقواعد.',
      keywords: 'الشروط والأحكام, شروط الاستخدام, سابق, قواعد',
      type: 'website'
    });

    this.jsonLdService.setBreadcrumbSchema([
      { name: 'الرئيسية', url: '/' },
      { name: 'الشروط والأحكام', url: '/terms-and-conditions' }
    ]);

    this.jsonLdService.setWebPageSchema(
      'الشروط والأحكام | سابق',
      'الشروط والأحكام لاستخدام منصة سابق للمسابقات التفاعلية',
      '/terms-and-conditions'
    );
  }
}
