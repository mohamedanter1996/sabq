import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
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
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly siteName = 'سابق - Sabq';
  private readonly siteUrl = 'https://sabq.com';
  private readonly defaultImage = 'https://sabq.com/assets/og-image.png';
  private readonly twitterHandle = '@sabq_quiz';

  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  updateSeo(config: SeoConfig): void {
    const fullTitle = config.title ? `${config.title} | ${this.siteName}` : this.siteName;
    const url = config.url || `${this.siteUrl}${this.router.url}`;
    const image = config.image || this.defaultImage;
    
    // Set title
    this.title.setTitle(fullTitle);

    // Basic meta tags
    this.updateMetaTag('description', config.description);
    if (config.keywords) {
      this.updateMetaTag('keywords', config.keywords);
    }
    this.updateMetaTag('author', config.author || 'Sabq');

    // OpenGraph tags
    this.updateMetaTag('og:title', fullTitle, true);
    this.updateMetaTag('og:description', config.description, true);
    this.updateMetaTag('og:url', url, true);
    this.updateMetaTag('og:image', image, true);
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

    // Canonical URL
    this.setCanonicalUrl(url);
  }

  setCanonicalUrl(url: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  setAlternateLanguages(arabicUrl: string, englishUrl: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
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
      description: 'سابق - منصة المسابقات التفاعلية. جاوب الأول واكسب! تحدى أصدقاءك في مسابقات الأسئلة.',
    });
  }
}
