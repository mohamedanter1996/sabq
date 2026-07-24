import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, HostBinding, Inject, Input, PLATFORM_ID } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-ad-slot',
  standalone: true,
  template: `
    @if (shouldRender) {
      <section class="ad-slot" [class]="placement" aria-label="مساحة إعلانية">
        @if (adsEnabled) {
          <ins
            class="adsbygoogle"
            [attr.data-ad-client]="client"
            [attr.data-ad-slot]="slotId"
            [attr.data-ad-format]="format"
            [attr.data-full-width-responsive]="responsive">
          </ins>
        } @else {
          <div class="ad-placeholder">
            <span>مساحة إعلانية</span>
            <small>{{ slotKey }}</small>
          </div>
        }
      </section>
    }
  `,
  styles: [`
    :host {
      display: block;
      margin: 22px 0;
    }

    :host(.ad-wide) {
      grid-column: 1 / -1;
    }

    .ad-slot {
      width: 100%;
      min-height: 90px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .ad-slot.banner {
      min-height: 90px;
    }

    .ad-slot.in-feed {
      min-height: 140px;
    }

    .ad-slot.rectangle {
      min-height: 250px;
    }

    .ad-slot.in-article {
      min-height: 250px;
      margin: 32px 0;
    }

    .adsbygoogle {
      display: block;
      width: 100%;
      min-height: inherit;
    }

    .ad-placeholder {
      width: 100%;
      min-height: inherit;
      border: 1px dashed #CBD5E1;
      border-radius: 8px;
      background: repeating-linear-gradient(
        45deg,
        #F8FAFC,
        #F8FAFC 10px,
        #F1F5F9 10px,
        #F1F5F9 20px
      );
      color: #64748B;
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 14px;
    }

    .ad-placeholder small {
      direction: ltr;
      font-size: 12px;
      opacity: 0.75;
    }
  `]
})
export class AdSlotComponent implements AfterViewInit {
  @Input() slotKey = '';
  @Input() placement: 'banner' | 'in-feed' | 'rectangle' | 'in-article' = 'banner';
  @Input() format = 'auto';
  @Input() responsive = 'true';
  @Input() wide = false;
  /**
   * Ads are allowed only in reviewed, curated editorial content. Existing game
   * and question surfaces stay ad-free even if ads are enabled later.
   */
  @Input() editorial = false;

  @HostBinding('class.ad-wide')
  get isWide(): boolean {
    return this.wide;
  }

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  get client(): string {
    return environment.ads.client;
  }

  get slotId(): string {
    const slots = environment.ads.slots as Record<string, string>;
    return slots[this.slotKey] || '';
  }

  get adsEnabled(): boolean {
    return this.editorial &&
      environment.ads.enabled &&
      !!this.client &&
      !!this.slotId &&
      isPlatformBrowser(this.platformId);
  }

  get shouldRender(): boolean {
    return this.editorial && (this.adsEnabled || environment.ads.showPlaceholders);
  }

  ngAfterViewInit(): void {
    if (!this.adsEnabled) {
      return;
    }

    this.ensureAdSenseScript();

    setTimeout(() => {
      const win = window as Window & { adsbygoogle?: unknown[] };
      win.adsbygoogle = win.adsbygoogle || [];
      win.adsbygoogle.push({});
    });
  }

  private ensureAdSenseScript(): void {
    if (this.document.querySelector('script[data-sabq-adsense="true"], script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
      return;
    }

    const script = this.document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset['sabqAdsense'] = 'true';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(this.client)}`;
    this.document.head.appendChild(script);
  }
}
