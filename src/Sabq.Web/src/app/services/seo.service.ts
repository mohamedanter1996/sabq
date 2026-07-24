import { Injectable, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';

export interface SeoConfig {
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  locale?: string;
  alternateLocale?: string;
  /**
   * Lets pages that are useful inside the application, but should not become
   * search landing pages, opt out of indexing without bypassing the shared SEO
   * service.
   */
  robots?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly siteName = 'سابق';
  private readonly siteUrl = 'https://sabiqgame.com';
  private readonly defaultImage = `${this.siteUrl}/assets/og-image.svg`;
  private readonly twitterHandle = '@sabq_quiz';

  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router,
    @Inject(DOCUMENT) private document: Document
  ) {}

  updateSeo(config: SeoConfig): void {
    const fullTitle = config.title ? `${config.title} | ${this.siteName}` : this.siteName;
    const url = this.normalizeCanonicalUrl(config.url || `${this.siteUrl}${this.router.url}`);
    const image = config.image || this.defaultImage;
    
    // Set title
    this.title.setTitle(fullTitle);

    // Basic meta tags
    this.updateMetaTag('description', config.description);
    this.updateMetaTag('robots', config.robots || 'index, follow');
    this.updateMetaTag('application-name', this.siteName);
    this.updateMetaTag('apple-mobile-web-app-title', this.siteName);
    if (config.keywords) {
      this.updateMetaTag('keywords', config.keywords);
    }
    this.updateMetaTag('author', config.author || 'Sabq');

    // OpenGraph tags
    this.updateMetaTag('og:title', fullTitle, true);
    this.updateMetaTag('og:description', config.description, true);
    this.updateMetaTag('og:url', url, true);
    this.updateMetaTag('og:image', image, true);
    this.updateMetaTag('og:image:alt', `${this.siteName} - لعبة أسئلة ومسابقات جماعية`, true);
    this.updateMetaTag('og:type', config.type || 'website', true);
    this.updateMetaTag('og:site_name', this.siteName, true);
    this.updateMetaTag('og:locale', config.locale || 'ar_SA', true);
    if (config.alternateLocale) {
      this.updateMetaTag('og:locale:alternate', config.alternateLocale, true);
    }

    // Article specific
    if (config.type === 'article') {
      if (config.publishedTime) {
        this.updateMetaTag('article:published_time', config.publishedTime, true);
      }
      if (config.modifiedTime) {
        this.updateMetaTag('article:modified_time', config.modifiedTime, true);
      }
      if (config.section) {
        this.updateMetaTag('article:section', config.section, true);
      }
    }

    // Twitter Card tags
    this.updateMetaTag('twitter:card', 'summary_large_image');
    this.updateMetaTag('twitter:site', this.twitterHandle);
    this.updateMetaTag('twitter:title', fullTitle);
    this.updateMetaTag('twitter:description', config.description);
    this.updateMetaTag('twitter:image', image);
    this.updateMetaTag('twitter:image:alt', `${this.siteName} - لعبة أسئلة ومسابقات جماعية`);

    // Canonical URL
    this.setCanonicalUrl(url);
  }

  setCanonicalUrl(url: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  /**
   * The public URL policy uses no trailing slash except for the site root.
   * Query strings and fragments describe a view of a page, not a separate
   * canonical document, so they are intentionally omitted.
   */
  private normalizeCanonicalUrl(url: string): string {
    const parsed = new URL(url, `${this.siteUrl}/`);
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    return `${parsed.origin}${pathname}`;
  }

  setAlternateLanguages(arabicUrl: string, englishUrl: string): void {
    // Arabic
    this.setAlternateLink('ar', arabicUrl);
    // English
    this.setAlternateLink('en', englishUrl);
    // x-default
    this.setAlternateLink('x-default', arabicUrl);
  }

  private setAlternateLink(hreflang: string, url: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`);
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', hreflang);
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private updateMetaTag(name: string, content: string, isProperty: boolean = false): void {
    if (isProperty) {
      this.meta.updateTag({ property: name, content });
    } else {
      this.meta.updateTag({ name, content });
    }
  }

  clearSeo(): void {
    this.title.setTitle(this.siteName);
    // Reset to defaults
    this.updateSeo({
      title: '',
      description: 'سابق لعبة أسئلة جماعية تفاعلية للمنافسة بين الأصدقاء. العب مسابقات كويز مباشرة واكتسب معلومات جديدة بطريقة ممتعة.',
    });
  }
}
