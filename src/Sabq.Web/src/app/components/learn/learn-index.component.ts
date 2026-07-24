import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LEARN_CHALLENGE_PACKS,
  LEARN_CHALLENGE_TOTAL_QUESTIONS,
  LearnChallengePack
} from '../../data/learn-challenges.data';
import { JsonLdService } from '../../services/json-ld.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-learn-index',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="learn-index-page">
      <div class="container">
        <nav class="breadcrumb" aria-label="مسار التنقل">
          <a routerLink="/">الرئيسية</a><span>›</span><span>تعلّم</span>
        </nav>

        <header class="hero">
          <p class="eyebrow">محتوى تحريري من سابق</p>
          <h1>تحديات تعلّم قصيرة، مع تفسير ومصادر</h1>
          <p>اختر مساراً واحداً، أجب بهدوء، ثم راجع التفسير والمصادر. الحزم هنا محررة ومحددة وليست أرشيفاً تلقائياً للأسئلة.</p>
          <div class="facts" aria-label="إحصاءات المحتوى">
            <span>{{ packs.length }} حزمة</span><span>{{ totalQuestions }} سؤالاً مشروحاً</span><span>مراجعة ومصادر في كل حزمة</span>
          </div>
        </header>

        <section class="method" aria-labelledby="method-title">
          <h2 id="method-title">كيف أستخدم هذه المسارات؟</h2>
          <p>المحتوى مناسب للتعلم العام والمراجعة الخفيفة. اعتمد على التفسير لفهم الفكرة، ثم افتح المصدر عند الحاجة إلى التوسع أو التحقق. نراجع الحزم دورياً ونرحب بتصحيح موثق عبر صفحة التواصل.</p>
        </section>

        <section class="pack-grid" aria-label="حزم التعلّم">
          @for (challengePack of packs; track challengePack.slug) {
            <article class="pack-card">
              <p class="pack-meta">{{ challengePack.questions.length }} أسئلة · نحو {{ challengePack.estimatedMinutes }} دقيقة</p>
              <h2><a [routerLink]="['/learn', challengePack.slug]">{{ challengePack.title }}</a></h2>
              <p>{{ challengePack.summary }}</p>
              <ul>
                @for (goal of challengePack.learningGoals; track goal) { <li>{{ goal }}</li> }
              </ul>
              <a class="pack-link" [routerLink]="['/learn', challengePack.slug]">ابدأ التحدي <span aria-hidden="true">←</span></a>
            </article>
          }
        </section>

        <aside class="review-note">
          <strong>ملاحظة تحريرية:</strong> لا نعرض إعلانات داخل هذه الصفحة. صفحات الحزم تضع أي مساحة إعلانية محتملة بعد المحتوى التعليمي كاملاً فقط.
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .learn-index-page { min-height: 100vh; background: var(--background); padding: 36px 20px 56px; }
    .container { max-width: 1120px; margin: 0 auto; }
    .breadcrumb { color: var(--text-secondary); font-size: .9rem; margin-bottom: 22px; }
    .breadcrumb a, .pack-link { color: var(--primary); text-decoration: none; }
    .breadcrumb span { margin: 0 8px; }
    .hero { background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 20px; color: white; padding: 44px; box-shadow: 0 12px 30px rgba(0,0,0,.14); }
    .eyebrow, .pack-meta { font-size: .82rem; font-weight: 700; letter-spacing: .02em; margin: 0 0 10px; }
    .hero h1 { font-size: clamp(2rem, 4vw, 3.1rem); margin: 0 0 14px; line-height: 1.25; }
    .hero > p:not(.eyebrow) { font-size: 1.1rem; line-height: 1.9; max-width: 760px; margin: 0; }
    .facts { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
    .facts span { background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.28); border-radius: 999px; padding: 8px 13px; }
    .method, .review-note { background: var(--card-bg); border-radius: 15px; margin: 24px 0; padding: 26px; }
    .method h2 { color: var(--text-primary); font-size: 1.35rem; margin: 0 0 10px; }
    .method p, .pack-card p, .pack-card li, .review-note { color: var(--text-secondary); line-height: 1.8; }
    .method p { margin: 0; }
    .pack-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(255px, 1fr)); gap: 18px; }
    .pack-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 15px; display: flex; flex-direction: column; padding: 24px; }
    .pack-meta { color: var(--primary); }
    .pack-card h2 { font-size: 1.25rem; line-height: 1.45; margin: 0 0 10px; }
    .pack-card h2 a { color: var(--text-primary); text-decoration: none; }
    .pack-card h2 a:hover { color: var(--primary); }
    .pack-card p { margin: 0 0 12px; }
    .pack-card ul { margin: 0 0 18px; padding-right: 20px; }
    .pack-link { font-weight: 700; margin-top: auto; }
    .review-note { border-right: 4px solid var(--primary); font-size: .95rem; }
    @media (max-width: 640px) { .hero { padding: 28px 22px; } .learn-index-page { padding-inline: 14px; } }
  `]
})
export class LearnIndexComponent implements OnInit {
  readonly packs: readonly LearnChallengePack[] = LEARN_CHALLENGE_PACKS;
  readonly totalQuestions = LEARN_CHALLENGE_TOTAL_QUESTIONS;

  constructor(private readonly seoService: SeoService, private readonly jsonLdService: JsonLdService) {}

  ngOnInit(): void {
    this.jsonLdService.removeJsonLd('question-schema');
    this.jsonLdService.removeJsonLd('quiz-schema');
    this.seoService.updateSeo({
      title: 'تحديات تعلّم ومراجعة معرفية',
      description: 'حزم تعلّم عربية قصيرة من سابق: أسئلة محددة، تفسيرات واضحة، ومصادر للمراجعة والتوسع.',
      keywords: 'تحديات تعليمية، أسئلة مشروحة، تعلم عربي، مراجعة معرفية، سابق',
      url: 'https://sabiqgame.com/learn',
      type: 'website'
    });
    this.jsonLdService.setBreadcrumbSchema([{ name: 'الرئيسية', url: '/' }, { name: 'تعلّم', url: '/learn' }]);
    this.jsonLdService.setWebPageSchema('تحديات تعلّم ومراجعة معرفية | سابق', 'حزم تعلّم عربية قصيرة مع أسئلة مشروحة ومصادر للمراجعة.', '/learn');
  }
}
