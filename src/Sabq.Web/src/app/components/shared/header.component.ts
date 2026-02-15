import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="site-header">
      <div class="header-backdrop"></div>
      <div class="header-container">
        <a routerLink="/login" class="logo">
          <div class="logo-icon-wrapper">
            <svg class="logo-icon" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#1E40AF"/>
                  <stop offset="100%" style="stop-color:#3B82F6"/>
                </linearGradient>
                <linearGradient id="boltGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#FCD34D"/>
                  <stop offset="100%" style="stop-color:#F59E0B"/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <rect width="48" height="48" rx="12" fill="url(#logoGradient)"/>
              <path d="M 28 6 L 16 26 L 23 26 L 18 42 L 36 18 L 27 18 Z" fill="url(#boltGradient)" filter="url(#glow)"/>
            </svg>
            <div class="logo-glow"></div>
          </div>
          <div class="logo-text-container">
            <span class="logo-text">سابق</span>
            <span class="logo-tagline">جاوب الأول... واكسب!</span>
          </div>
        </a>
        
        <button class="menu-toggle" (click)="toggleMenu()" [class.active]="menuOpen" aria-label="القائمة">
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <nav class="main-nav" [class.open]="menuOpen">
          <a routerLink="/login" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span class="nav-text">الرئيسية</span>
          </a>
          <a routerLink="/questions" routerLinkActive="active" class="nav-link">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span class="nav-text">الأسئلة</span>
          </a>
          <a routerLink="/about" routerLinkActive="active" class="nav-link">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span class="nav-text">من نحن</span>
          </a>
          <a routerLink="/contact" routerLinkActive="active" class="nav-link cta-link">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span class="nav-text">تواصل معنا</span>
          </a>
        </nav>
      </div>
    </header>
  `,
  styles: [`
    .site-header {
      position: sticky;
      top: 0;
      z-index: 1000;
      padding: 0;
    }
    
    .header-backdrop {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%);
      box-shadow: 
        0 4px 30px rgba(0, 0, 0, 0.3),
        0 1px 0 rgba(255, 255, 255, 0.08) inset;
    }
    
    .header-backdrop::before {
      content: '';
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(ellipse at 20% 0%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 100%, rgba(251, 191, 36, 0.1) 0%, transparent 50%);
      pointer-events: none;
    }
    
    .header-container {
      position: relative;
      max-width: 1280px;
      margin: 0 auto;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      direction: rtl;
    }
    
    /* Logo Styles */
    .logo {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      text-decoration: none;
      color: white;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    .logo:hover {
      transform: scale(1.03);
    }
    
    .logo-icon-wrapper {
      position: relative;
    }
    
    .logo-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      filter: drop-shadow(0 4px 12px rgba(59, 130, 246, 0.35));
      transition: all 0.3s ease;
    }
    
    .logo:hover .logo-icon {
      filter: drop-shadow(0 8px 24px rgba(59, 130, 246, 0.5));
      transform: rotate(-3deg);
    }
    
    .logo-glow {
      position: absolute;
      inset: -6px;
      background: conic-gradient(from 0deg, #3B82F6, #FCD34D, #3B82F6);
      border-radius: 18px;
      filter: blur(16px);
      opacity: 0;
      transition: opacity 0.4s ease;
      z-index: -1;
      animation: rotate 4s linear infinite;
    }
    
    @keyframes rotate {
      100% { transform: rotate(360deg); }
    }
    
    .logo:hover .logo-glow {
      opacity: 0.6;
    }
    
    .logo-text-container {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .logo-text {
      font-family: 'Aref Ruqaa', 'Amiri', serif;
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(90deg, #FCD34D 0%, #FBBF24 25%, #F59E0B 50%, #FBBF24 75%, #FCD34D 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      animation: shimmer 3s linear infinite;
      text-shadow: 0 0 30px rgba(251, 191, 36, 0.3);
    }
    
    @keyframes shimmer {
      0% { background-position: 0% center; }
      100% { background-position: 200% center; }
    }
    
    .logo-tagline {
      font-family: 'Cairo', sans-serif;
      font-size: 0.7rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.6);
      letter-spacing: 0.3px;
    }
    
    /* Navigation Styles */
    .main-nav {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    
    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      font-family: 'Cairo', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      padding: 0.6rem 1rem;
      border-radius: 10px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      border: 1px solid transparent;
    }
    
    .nav-link::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04));
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: 10px;
    }
    
    .nav-link::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, #FCD34D, #F59E0B);
      transition: width 0.3s ease;
      border-radius: 1px;
    }
    
    .nav-link:hover {
      color: white;
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.1);
    }
    
    .nav-link:hover::before {
      opacity: 1;
    }
    
    .nav-link:hover::after {
      width: 60%;
    }
    
    .nav-link.active {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.3);
      color: #FCD34D;
    }
    
    .nav-link.active::after {
      width: 80%;
    }
    
    /* CTA Button */
    .nav-link.cta-link {
      background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
      color: white;
      border: none;
      box-shadow: 
        0 4px 15px rgba(245, 158, 11, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.1) inset;
      padding: 0.6rem 1.25rem;
    }
    
    .nav-link.cta-link::before {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
    }
    
    .nav-link.cta-link::after {
      display: none;
    }
    
    .nav-link.cta-link:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 
        0 8px 25px rgba(245, 158, 11, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.15) inset;
    }
    
    .nav-link.cta-link.active {
      background: linear-gradient(135deg, #D97706 0%, #B45309 100%);
    }
    
    .nav-icon {
      width: 18px;
      height: 18px;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      flex-shrink: 0;
    }
    
    .nav-link:hover .nav-icon {
      transform: scale(1.15) rotate(-5deg);
    }
    
    .nav-text {
      white-space: nowrap;
    }
    
    /* Menu Toggle */
    .menu-toggle {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      cursor: pointer;
      padding: 0.75rem;
      transition: all 0.3s ease;
      backdrop-filter: blur(8px);
    }
    
    .menu-toggle:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.25);
    }
    
    .menu-toggle span {
      display: block;
      width: 22px;
      height: 2.5px;
      background: linear-gradient(90deg, #FCD34D, #F59E0B);
      border-radius: 2px;
      transition: all 0.35s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      box-shadow: 0 0 8px rgba(251, 191, 36, 0.3);
    }
    
    .menu-toggle.active span:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }
    
    .menu-toggle.active span:nth-child(2) {
      opacity: 0;
      transform: scaleX(0);
    }
    
    .menu-toggle.active span:nth-child(3) {
      transform: rotate(-45deg) translate(5px, -5px);
    }
    
    /* Mobile Responsive */
    @media (max-width: 900px) {
      .header-container {
        padding: 0.625rem 1rem;
      }
      
      .menu-toggle {
        display: flex;
      }
      
      .main-nav {
        position: absolute;
        top: calc(100% + 10px);
        right: 1rem;
        left: 1rem;
        background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 58, 138, 0.95) 100%);
        backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        flex-direction: column;
        padding: 1rem;
        gap: 0.375rem;
        display: none;
        box-shadow: 
          0 25px 50px rgba(0, 0, 0, 0.5),
          0 0 0 1px rgba(255, 255, 255, 0.05) inset,
          0 -10px 30px rgba(59, 130, 246, 0.1) inset;
      }
      
      .main-nav.open {
        display: flex;
        animation: slideDown 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-15px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      .nav-link {
        padding: 0.875rem 1.25rem;
        border-radius: 14px;
        justify-content: flex-start;
      }
      
      .nav-link::after {
        display: none;
      }
      
      .nav-link.cta-link {
        margin-top: 0.5rem;
        justify-content: center;
      }
      
      .logo-tagline {
        display: none;
      }
      
      .logo-icon {
        width: 44px;
        height: 44px;
      }
      
      .logo-text {
        font-size: 1.6rem;
      }
    }
    
    @media (max-width: 400px) {
      .logo-text {
        font-size: 1.4rem;
      }
      
      .logo-icon {
        width: 38px;
        height: 38px;
      }
    }
  `]
})
export class HeaderComponent {
  menuOpen = false;
  
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}
