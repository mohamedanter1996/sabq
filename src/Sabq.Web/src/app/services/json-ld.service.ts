import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export interface Question {
  id: string;
  textAr: string;
  textEn: string;
  slug: string;
  categorySlug: string;
  categoryNameAr: string;
  categoryNameEn: string;
  difficulty: string;
  options: Option[];
  lastModified?: string;
}

export interface Option {
  id: string;
  textAr: string;
  textEn: string;
  isCorrect: boolean;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class JsonLdService {
  private readonly siteUrl = 'https://sabq.com';

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  setQuestionSchema(question: Question): void {
    const correctOption = question.options.find(o => o.isCorrect);
    const incorrectOptions = question.options.filter(o => !o.isCorrect);

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Question',
      'name': question.textAr,
      'text': question.textAr,
      'inLanguage': 'ar',
      'dateModified': question.lastModified || new Date().toISOString(),
      'author': {
        '@type': 'Organization',
        'name': 'سابق - Sabq',
        'url': this.siteUrl
      },
      'acceptedAnswer': correctOption ? {
        '@type': 'Answer',
        'text': correctOption.textAr
      } : undefined,
      'suggestedAnswer': incorrectOptions.map(opt => ({
        '@type': 'Answer',
        'text': opt.textAr
      }))
    };

    this.setJsonLd('question-schema', schema);
  }

  setQuizSchema(questions: Question[], quizName: string): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Quiz',
      'name': quizName,
      'about': {
        '@type': 'Thing',
        'name': 'أسئلة ثقافية وتعليمية'
      },
      'educationalLevel': 'General',
      'inLanguage': 'ar',
      'provider': {
        '@type': 'Organization',
        'name': 'سابق - Sabq',
        'url': this.siteUrl
      },
      'hasPart': questions.map(q => ({
        '@type': 'Question',
        'name': q.textAr,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': q.options.find(o => o.isCorrect)?.textAr || ''
        }
      }))
    };

    this.setJsonLd('quiz-schema', schema);
  }

  setBreadcrumbSchema(items: BreadcrumbItem[]): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': items.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
        'item': item.url.startsWith('http') ? item.url : `${this.siteUrl}${item.url}`
      }))
    };

    this.setJsonLd('breadcrumb-schema', schema);
  }

  setFAQSchema(faqs: { question: string; answer: string }[]): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer
        }
      }))
    };

    this.setJsonLd('faq-schema', schema);
  }

  setOrganizationSchema(): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'سابق - Sabq',
      'alternateName': 'Sabq Quiz Platform',
      'url': this.siteUrl,
      'logo': `${this.siteUrl}/assets/logo.png`,
      'sameAs': [
        'https://twitter.com/sabq_quiz',
        'https://www.facebook.com/sabqquiz',
        'https://www.instagram.com/sabq_quiz'
      ],
      'contactPoint': {
        '@type': 'ContactPoint',
        'contactType': 'customer service',
        'email': 'support@sabq.com',
        'availableLanguage': ['Arabic', 'English']
      }
    };

    this.setJsonLd('organization-schema', schema);
  }

  setWebsiteSchema(): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'سابق - Sabq',
      'alternateName': 'Sabq Multiplayer Quiz Game',
      'url': this.siteUrl,
      'inLanguage': ['ar', 'en'],
      'potentialAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': `${this.siteUrl}/questions?search={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    };

    this.setJsonLd('website-schema', schema);
  }

  setWebPageSchema(title: string, description: string, url: string): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': title,
      'description': description,
      'url': url.startsWith('http') ? url : `${this.siteUrl}${url}`,
      'inLanguage': 'ar',
      'isPartOf': {
        '@type': 'WebSite',
        'name': 'سابق - Sabq',
        'url': this.siteUrl
      }
    };

    this.setJsonLd('webpage-schema', schema);
  }

  private setJsonLd(id: string, schema: any): void {
    if (!isPlatformBrowser(this.platformId)) return;

    let script = this.document.getElementById(id) as HTMLScriptElement;
    if (!script) {
      script = this.document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
  }

  removeJsonLd(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const script = this.document.getElementById(id);
    if (script) {
      script.remove();
    }
  }

  clearAllJsonLd(): void {
    const ids = ['question-schema', 'quiz-schema', 'breadcrumb-schema', 'faq-schema', 'organization-schema', 'website-schema', 'webpage-schema'];
    ids.forEach(id => this.removeJsonLd(id));
  }
}
