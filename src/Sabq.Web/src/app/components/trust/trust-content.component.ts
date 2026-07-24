import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { JsonLdService } from '../../services/json-ld.service';
import { SeoService } from '../../services/seo.service';

interface TrustSection { title: string; paragraphs: readonly string[]; bullets?: readonly string[]; }
interface TrustPage { title: string; description: string; path: string; updatedAt: string; intro: string; sections: readonly TrustSection[]; }

const TRUST_PAGES: Record<string, TrustPage> = {
  'editorial-policy': {
    title: 'المنهجية التحريرية والمصادر', path: '/editorial-policy', updatedAt: '2026-07-25',
    description: 'منهجية تحرير حزم التعلّم في سابق، وطريقة استخدام المصادر والمراجعة والتحديث.',
    intro: 'تشرح هذه الصفحة كيف نعد حزم التعلّم المنشورة في قسم «تعلّم». وهي لا تصف بنك أسئلة اللعبة أو تمنحه صفة محتوى تحريري مستقل.',
    sections: [
      { title: 'ما الذي نحرره؟', paragraphs: ['تتكون كل حزمة منشورة من مقدمة تعليمية وعشرة أسئلة محددة وتفسير للإجابة ومصادر مراجعة وتاريخ تحديث.', 'نختار موضوعاً محدوداً يمكن شرحه بوضوح، بدلاً من نشر صفحات تلقائية منفصلة لكل سؤال.'] },
      { title: 'المراجعة والمصادر', paragraphs: ['يراجع فريق المحتوى التحريري في سابق صياغة السؤال والإجابة والتفسير قبل النشر، ثم يربط الحزمة بمصادر موثوقة مناسبة للموضوع.', 'نفضل المصادر الأولية أو الجهات المتخصصة متى كانت متاحة، ونذكر اسم الجهة والرابط حتى يستطيع القارئ التحقق أو التوسع.'], bullets: ['لا ننقل نصوص المصادر الطويلة إلى الحزمة.', 'المصدر الخارجي لا يعني بالضرورة تأييداً لمحتوى الموقع كله.', 'المحتوى التعليمي العام لا يحل محل استشارة متخصصة.'] },
      { title: 'التحديث والتصحيح', paragraphs: ['نراجع الحزم عندما تظهر ملاحظات موثقة أو تتغير حقيقة ذات صلة. يظهر تاريخ آخر تحديث داخل كل حزمة.', 'لإرسال تصحيح، استخدم صفحة التصحيحات وأرفق رابطاً ومصدراً يمكن مراجعته.'] }
    ]
  },
  corrections: {
    title: 'التصحيحات', path: '/corrections', updatedAt: '2026-07-25',
    description: 'كيفية الإبلاغ عن خطأ أو اقتراح تصحيح في محتوى التعلّم المنشور في سابق.',
    intro: 'الدقة عملية مستمرة. إذا وجدت خطأً في حزمة تعلّم أو كان لديك مصدر أحدث، أرسل ملاحظة محددة تساعدنا على التحقق.',
    sections: [
      { title: 'ما الذي نحتاجه في البلاغ؟', paragraphs: ['كلما كان البلاغ محدداً كان التحقق أسرع وأكثر عدلاً. لا ترسل بيانات شخصية حساسة داخل الرسالة.'], bullets: ['رابط الحزمة أو عنوانها والسؤال المقصود.', 'النص أو الإجابة التي تعتقد أنها تحتاج تصحيحاً.', 'مصدر موثوق ورابطه، مع شرح موجز لسبب الصلة.'] },
      { title: 'ماذا نفعل بعد الاستلام؟', paragraphs: ['نراجع الادعاء والمصدر والسياق. عندما يثبت وجود خطأ أو نقص مؤثر نحدّث النص أو المصدر أو نزيله إذا لم يعد قابلاً للدعم.', 'قد لا نطبق اقتراحاً إذا لم يكن مدعوماً بمصدر كافٍ، لكن وجود بلاغ موثق يساعد على تحسين المراجعة.'] },
      { title: 'طريقة التواصل', paragraphs: ['استخدم صفحة التواصل لإرسال البلاغ. لا تستخدم التعليقات العامة لنشر بيانات حسابات أو رموز تحقق أو معلومات حساسة.'] }
    ]
  },
  team: {
    title: 'فريق المحتوى في سابق', path: '/team', updatedAt: '2026-07-25',
    description: 'تعريف بدور فريق المحتوى التحريري ومسؤوليته عن حزم التعلّم المنشورة في سابق.',
    intro: 'يُراجع فريق المحتوى التحريري في سابق حزم التعلّم المنشورة، ويهتم بأن تكون فائدتها التعليمية أوضح من مجرد عرض سؤال وإجابة.',
    sections: [
      { title: 'دور الفريق', paragraphs: ['يكتب الفريق المقدمات والتفسيرات، ويختار مصادر المراجعة، ويحدد تاريخ التحديث المعروض في كل حزمة.', 'يحافظ الفريق على الفصل بين حزم التعلّم المحررة وبين تجربة اللعب وبنك الأسئلة التشغيلي.'] },
      { title: 'حدود المسؤولية', paragraphs: ['لا ندعي أن الحزم مراجع دراسية شاملة أو بديل عن المختصين. نوضح هذه الحدود داخل الموضوعات التي قد تتطلب إرشاداً متخصصاً.', 'لا ننشر إحصاءات استخدام أو إنجازات لا يمكن توثيقها في هذه الصفحة.'] },
      { title: 'التواصل والمساءلة', paragraphs: ['يمكن للقارئ اقتراح موضوع أو الإبلاغ عن خطأ من خلال صفحة التواصل والتصحيحات. تساعد الملاحظات الموثقة في تحديد أولويات المراجعة.'] }
    ]
  }
};

@Component({
  selector: 'app-trust-content',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="trust-page"><main class="container" *ngIf="page">
      <nav class="breadcrumb" aria-label="مسار التنقل"><a routerLink="/">الرئيسية</a><span>›</span><span>{{ page.title }}</span></nav>
      <header><p>الشفافية والمسؤولية</p><h1>{{ page.title }}</h1><span>آخر تحديث: {{ page.updatedAt }}</span></header>
      <p class="intro">{{ page.intro }}</p>
      <section *ngFor="let section of page.sections"><h2>{{ section.title }}</h2><p *ngFor="let paragraph of section.paragraphs">{{ paragraph }}</p><ul *ngIf="section.bullets"><li *ngFor="let bullet of section.bullets">{{ bullet }}</li></ul></section>
      <aside><strong>هل تحتاج إلى مساعدة؟</strong><a routerLink="/contact">تواصل معنا</a><a routerLink="/corrections">أرسل تصحيحاً</a></aside>
    </main></div>
  `,
  styles: [`
    .trust-page { background: var(--background); min-height: 100vh; padding: 36px 20px 56px; }.container { margin: 0 auto; max-width: 820px; }.breadcrumb { color: var(--text-secondary); font-size: .9rem; margin-bottom: 22px; }.breadcrumb a, aside a { color: var(--primary); text-decoration: none; }.breadcrumb span { margin: 0 8px; }header, section, aside { background: var(--card-bg); border-radius: 15px; padding: 28px; }header { background: linear-gradient(135deg,var(--primary),var(--secondary)); color:white; }header p, header h1 { margin: 0 0 10px; }header h1 { font-size: clamp(1.85rem,4vw,2.6rem); }header span { font-size: .9rem; }.intro { color: var(--text-secondary); font-size: 1.08rem; line-height: 1.9; margin: 24px 4px; }section { margin-top: 18px; }h2 { color: var(--text-primary); font-size: 1.32rem; margin: 0 0 10px; }section p, li { color: var(--text-secondary); line-height: 1.85; }ul { padding-right: 22px; }aside { border-right: 4px solid var(--primary); display:flex; flex-wrap:wrap; gap:12px; margin-top:18px; }aside strong { color:var(--text-primary); }@media(max-width:640px){.trust-page{padding-inline:14px}header,section,aside{padding:22px}}
  `]
})
export class TrustContentComponent implements OnInit {
  page?: TrustPage;

  constructor(private readonly route: ActivatedRoute, private readonly seoService: SeoService, private readonly jsonLdService: JsonLdService) {}

  ngOnInit(): void {
    this.page = TRUST_PAGES[this.route.snapshot.data['trustPage'] as string];
    if (!this.page) { return; }
    this.jsonLdService.removeJsonLd('question-schema');
    this.jsonLdService.removeJsonLd('quiz-schema');
    this.seoService.updateSeo({ title: this.page.title, description: this.page.description, url: `https://sabiqgame.com${this.page.path}`, type: 'website' });
    this.jsonLdService.setBreadcrumbSchema([{ name: 'الرئيسية', url: '/' }, { name: this.page.title, url: this.page.path }]);
    this.jsonLdService.setWebPageSchema(this.page.title, this.page.description, this.page.path);
  }
}
