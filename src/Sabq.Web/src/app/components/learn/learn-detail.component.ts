import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Meta } from '@angular/platform-browser';
import { AdSlotComponent } from '../shared/ad-slot.component';
import { JsonLdService } from '../../services/json-ld.service';
import { SeoService } from '../../services/seo.service';
import {
  findLearnChallengePack,
  LearnChallengePack,
  LearnChallengeQuestion
} from '../../data/learn-challenges.data';

@Component({
  selector: 'app-learn-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, AdSlotComponent],
  template: `
    <div class="learn-detail-page">
      <div class="container" *ngIf="pack as challengePack; else unavailable">
        <nav class="breadcrumb" aria-label="مسار التنقل">
          <a routerLink="/">الرئيسية</a><span>›</span><a routerLink="/learn">تعلّم</a><span>›</span><span>{{ challengePack.title }}</span>
        </nav>

        <header class="article-header">
          <p class="eyebrow">حزمة تعلّم محررة</p>
          <h1>{{ challengePack.title }}</h1>
          <p class="summary">{{ challengePack.summary }}</p>
          <div class="article-meta">
            <span>{{ challengePack.questions.length }} أسئلة</span><span>نحو {{ challengePack.estimatedMinutes }} دقيقة</span><span>آخر تحديث: {{ challengePack.updatedAt }}</span>
          </div>
        </header>

        <section class="intro" aria-labelledby="intro-title">
          <h2 id="intro-title">قبل أن تبدأ</h2>
          <p>{{ challengePack.introduction }}</p>
          <div class="goals"><strong>ستتدرب على:</strong><span *ngFor="let goal of challengePack.learningGoals">{{ goal }}</span></div>
        </section>

        <section class="questions" aria-label="أسئلة الحزمة">
          <article class="question-card" *ngFor="let item of challengePack.questions; let index = index">
            <p class="question-number">السؤال {{ index + 1 }} من {{ challengePack.questions.length }}</p>
            <h2>{{ item.prompt }}</h2>
            <div class="choices" role="group" [attr.aria-label]="item.prompt">
              <button
                *ngFor="let choice of item.choices; let choiceIndex = index"
                type="button"
                (click)="selectAnswer(item, choiceIndex)"
                [class.selected]="selectedAnswer(item.id) === choiceIndex"
                [class.correct]="hasAnswered(item.id) && choiceIndex === item.correctChoiceIndex"
                [class.incorrect]="selectedAnswer(item.id) === choiceIndex && choiceIndex !== item.correctChoiceIndex">
                <span class="choice-letter">{{ choiceLetter(choiceIndex) }}</span>{{ choice }}
              </button>
            </div>
            <details class="explanation" [open]="hasAnswered(item.id)">
              <summary>الجواب والتفسير</summary>
              <p><strong>الإجابة الصحيحة: {{ item.choices[item.correctChoiceIndex] }}.</strong> {{ item.explanation }}</p>
            </details>
          </article>
        </section>

        <section class="editorial-info" aria-labelledby="sources-title">
          <h2 id="sources-title">المراجعة والمصادر</h2>
          <p><strong>المراجع:</strong> {{ challengePack.reviewerName }}.</p>
          <p>{{ challengePack.reviewMethod }}</p>
          <ul>
            <li *ngFor="let source of challengePack.sources"><a [href]="source.url" target="_blank" rel="noopener noreferrer">{{ source.title }}</a><span> — {{ source.publisher }}</span></li>
          </ul>
          <p class="updated">نُشرت الحزمة في {{ challengePack.publishedAt }}، وآخر مراجعة لها {{ challengePack.updatedAt }}.</p>
        </section>

        <app-ad-slot slotKey="editorialArticle" placement="in-article" [editorial]="true"></app-ad-slot>
      </div>

      <ng-template #unavailable>
        <div class="unavailable">
          <h1>هذه الحزمة غير متاحة</h1>
          <p>قد يكون الرابط غير صحيح أو أن الحزمة نُقلت. يمكنك العودة إلى جميع مسارات التعلّم.</p>
          <a routerLink="/learn">عرض مسارات التعلّم</a>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .learn-detail-page { background: var(--background); min-height: 100vh; padding: 36px 20px 56px; }
    .container, .unavailable { margin: 0 auto; max-width: 860px; }
    .breadcrumb { color: var(--text-secondary); font-size: .9rem; margin-bottom: 22px; overflow-wrap: anywhere; }
    .breadcrumb a, .editorial-info a, .unavailable a { color: var(--primary); text-decoration: none; }
    .breadcrumb span { margin: 0 8px; }
    .article-header { background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 20px; color: #fff; padding: 40px; }
    .eyebrow, .question-number { font-size: .82rem; font-weight: 700; letter-spacing: .02em; margin: 0 0 10px; }
    .article-header h1 { font-size: clamp(2rem, 4vw, 3rem); line-height: 1.25; margin: 0 0 14px; }
    .summary, .intro p, .editorial-info p, .editorial-info li { line-height: 1.85; }
    .summary { font-size: 1.1rem; margin: 0; }
    .article-meta, .goals { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 22px; }
    .article-meta span, .goals span { border-radius: 999px; padding: 7px 12px; }
    .article-meta span { background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.25); }
    .intro, .editorial-info, .question-card, .unavailable { background: var(--card-bg); border-radius: 15px; padding: 27px; }
    .intro, .editorial-info { margin-top: 22px; }
    .intro h2, .editorial-info h2 { color: var(--text-primary); font-size: 1.35rem; margin: 0 0 10px; }
    .intro p, .editorial-info p, .editorial-info li { color: var(--text-secondary); }
    .intro p { margin: 0; }
    .goals strong { align-self: center; color: var(--text-primary); }
    .goals span { background: var(--background); color: var(--text-secondary); }
    .questions { display: grid; gap: 18px; margin-top: 22px; }
    .question-card { border: 1px solid var(--border); }
    .question-number { color: var(--primary); }
    .question-card h2 { color: var(--text-primary); font-size: 1.2rem; line-height: 1.7; margin: 0 0 16px; }
    .choices { display: grid; gap: 9px; }
    .choices button { align-items: center; background: var(--background); border: 1px solid var(--border); border-radius: 10px; color: var(--text-primary); cursor: pointer; display: flex; font: inherit; gap: 10px; padding: 11px 13px; text-align: right; }
    .choices button:hover, .choices button.selected { border-color: var(--primary); }
    .choices button.correct { background: #e6f7ed; border-color: #20744a; color: #135b35; }
    .choices button.incorrect { background: #fff0f0; border-color: #b83a3a; color: #8b2020; }
    .choice-letter { background: var(--card-bg); border: 1px solid currentColor; border-radius: 50%; flex: 0 0 25px; height: 25px; line-height: 23px; text-align: center; }
    .explanation { background: var(--background); border-radius: 10px; color: var(--text-secondary); margin-top: 14px; padding: 0 14px; }
    .explanation summary { color: var(--primary); cursor: pointer; font-weight: 700; padding: 13px 0; }
    .explanation p { line-height: 1.85; margin: 0 0 13px; }
    .editorial-info ul { padding-right: 20px; }
    .updated { font-size: .92rem; }
    .unavailable { margin-top: 48px; text-align: center; }
    .unavailable h1 { color: var(--text-primary); }
    .unavailable p { color: var(--text-secondary); line-height: 1.8; }
    .unavailable a { font-weight: 700; }
    @media (max-width: 640px) { .learn-detail-page { padding-inline: 14px; } .article-header, .intro, .editorial-info, .question-card { padding: 22px; } }
  `]
})
export class LearnDetailComponent implements OnInit, OnDestroy {
  pack?: LearnChallengePack;
  private readonly answers = new Map<string, number>();
  private routeSubscription?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly seoService: SeoService,
    private readonly jsonLdService: JsonLdService,
    private readonly meta: Meta
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => this.loadPack(params.get('slug')));
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  selectAnswer(question: LearnChallengeQuestion, choiceIndex: number): void {
    this.answers.set(question.id, choiceIndex);
  }

  selectedAnswer(questionId: string): number | undefined {
    return this.answers.get(questionId);
  }

  hasAnswered(questionId: string): boolean {
    return this.answers.has(questionId);
  }

  choiceLetter(index: number): string {
    return ['أ', 'ب', 'ج', 'د'][index] || String(index + 1);
  }

  private loadPack(slug: string | null): void {
    this.answers.clear();
    this.pack = findLearnChallengePack(slug);
    this.jsonLdService.removeJsonLd('question-schema');
    this.jsonLdService.removeJsonLd('quiz-schema');

    if (!this.pack) {
      this.seoService.updateSeo({ title: 'حزمة غير متاحة', description: 'لم نعثر على حزمة التعلّم المطلوبة.', url: 'https://sabiqgame.com/learn', type: 'website' });
      this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
      return;
    }

    const url = `https://sabiqgame.com/learn/${this.pack.slug}`;
    this.seoService.updateSeo({
      title: this.pack.title,
      description: this.pack.summary,
      keywords: 'تعلّم عربي، أسئلة مشروحة، مراجعة معرفية، سابق',
      url,
      type: 'article',
      author: this.pack.reviewerName,
      publishedTime: `${this.pack.publishedAt}T00:00:00+03:00`,
      modifiedTime: `${this.pack.updatedAt}T00:00:00+03:00`,
      section: 'تعلّم'
    });
    this.jsonLdService.setBreadcrumbSchema([{ name: 'الرئيسية', url: '/' }, { name: 'تعلّم', url: '/learn' }, { name: this.pack.title, url: `/learn/${this.pack.slug}` }]);
    this.jsonLdService.setWebPageSchema(this.pack.title, this.pack.summary, `/learn/${this.pack.slug}`);
  }
}
