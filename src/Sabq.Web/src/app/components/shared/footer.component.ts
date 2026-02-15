import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="site-footer">
      <div class="footer-glow"></div>
      <div class="footer-container">
        <!-- Brand Section -->
        <div class="footer-brand">
          <div class="brand-logo">
            <svg class="footer-icon" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="footerLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#1E40AF"/>
                  <stop offset="100%" style="stop-color:#3B82F6"/>
                </linearGradient>
                <linearGradient id="footerBoltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#FCD34D"/>
                  <stop offset="100%" style="stop-color:#F59E0B"/>
                </linearGradient>
              </defs>
              <rect width="48" height="48" rx="12" fill="url(#footerLogoGrad)"/>
              <path d="M 28 6 L 16 26 L 23 26 L 18 42 L 36 18 L 27 18 Z" fill="url(#footerBoltGrad)"/>
            </svg>
            <div class="brand-text">
              <h3 class="brand-name">سابق</h3>
              <p class="brand-tagline">جاوب الأول... واكسب!</p>
            </div>
          </div>
          <p class="brand-description">منصة عربية رائدة لألعاب الأسئلة والمسابقات التفاعلية. انضم إلى مجتمعنا وتحدى أصدقاءك!</p>

          <!-- Social Links -->
          <div class="social-links">
            <a href="https://twitter.com/sabq_quiz" target="_blank" rel="noopener" class="social-link twitter" aria-label="تويتر">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://facebook.com/sabqquiz" target="_blank" rel="noopener" class="social-link facebook" aria-label="فيسبوك">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://instagram.com/sabq_quiz" target="_blank" rel="noopener" class="social-link instagram" aria-label="إنستغرام">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="https://youtube.com/@sabq_quiz" target="_blank" rel="noopener" class="social-link youtube" aria-label="يوتيوب">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>
        
        <!-- Links Sections -->
        <div class="footer-links">
          <div class="link-group">
            <h4>
              <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              روابط سريعة
            </h4>
            <ul>
              <li><a routerLink="/login"><span class="link-arrow">←</span> الرئيسية</a></li>
              <li><a routerLink="/questions"><span class="link-arrow">←</span> الأسئلة</a></li>
              <li><a routerLink="/about"><span class="link-arrow">←</span> من نحن</a></li>
              <li><a routerLink="/contact"><span class="link-arrow">←</span> تواصل معنا</a></li>
            </ul>
          </div>
          
          <div class="link-group">
            <h4>
              <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              قانوني
            </h4>
            <ul>
              <li><a routerLink="/privacy-policy"><span class="link-arrow">←</span> سياسة الخصوصية</a></li>
              <li><a routerLink="/terms-and-conditions"><span class="link-arrow">←</span> الشروط والأحكام</a></li>
            </ul>
          </div>
          
          <div class="link-group">
            <h4>
              <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              تواصل
            </h4>
            <ul>
              <li class="contact-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                info&#64;sabq.app
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- Bottom Bar -->
      <div class="footer-bottom">
        <div class="footer-bottom-container">
          <p class="copyright">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M14.83 14.83a4 4 0 1 1 0-5.66"></path>
            </svg>
            {{ currentYear }} سابق. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .site-footer {
      position: relative;
      background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
      color: white;
      margin-top: auto;
      direction: rtl;
      overflow: hidden;
    }
    
    .footer-glow {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      height: 1px;
      background: linear-gradient(90deg, transparent, #3B82F6, #FCD34D, #3B82F6, transparent);
      box-shadow: 0 0 20px 2px rgba(59, 130, 246, 0.5);
    }
    
    .footer-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 3rem 1.5rem 2rem;
      display: grid;
      grid-template-columns: 1.2fr 2fr;
      gap: 3rem;
    }
    
    /* Brand Section */
    .footer-brand {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    
    .footer-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      filter: drop-shadow(0 4px 12px rgba(59, 130, 246, 0.3));
    }
    
    .brand-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .brand-name {
      font-family: 'Aref Ruqaa', 'Amiri', serif;
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0;
      background: linear-gradient(135deg, #FCD34D, #F59E0B);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
    }
    
    .brand-tagline {
      font-family: 'Cairo', sans-serif;
      font-size: 0.75rem;
      margin: 0;
      color: rgba(255, 255, 255, 0.6);
    }
    
    .brand-description {
      font-family: 'Cairo', sans-serif;
      font-size: 0.9rem;
      line-height: 1.7;
      color: rgba(255, 255, 255, 0.7);
      margin: 0;
    }
    
    /* Social Links */
    .social-links {
      display: flex;
      gap: 0.75rem;
    }
    
    .social-link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 12px;
      color: white;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    .social-link:hover {
      transform: translateY(-3px) scale(1.05);
    }
    
    .social-link.twitter {
      background: linear-gradient(135deg, #1DA1F2, #0d8bd9);
      box-shadow: 0 4px 15px rgba(29, 161, 242, 0.4);
    }
    
    .social-link.twitter:hover {
      box-shadow: 0 8px 25px rgba(29, 161, 242, 0.5);
    }
    
    .social-link.facebook {
      background: linear-gradient(135deg, #1877F2, #0d5fc7);
      box-shadow: 0 4px 15px rgba(24, 119, 242, 0.4);
    }
    
    .social-link.facebook:hover {
      box-shadow: 0 8px 25px rgba(24, 119, 242, 0.5);
    }
    
    .social-link.instagram {
      background: linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4);
      box-shadow: 0 4px 15px rgba(221, 42, 123, 0.4);
    }
    
    .social-link.instagram:hover {
      box-shadow: 0 8px 25px rgba(221, 42, 123, 0.5);
    }
    
    .social-link.youtube {
      background: linear-gradient(135deg, #FF0000, #CC0000);
      box-shadow: 0 4px 15px rgba(255, 0, 0, 0.4);
    }
    
    .social-link.youtube:hover {
      box-shadow: 0 8px 25px rgba(255, 0, 0, 0.5);
    }
    
    .social-link svg {
      width: 20px;
      height: 20px;
    }
    
    /* Links Section */
    .footer-links {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }
    
    .link-group h4 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: 'Cairo', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
      color: #FCD34D;
    }
    
    .section-icon {
      width: 18px;
      height: 18px;
      stroke: #FCD34D;
    }
    
    .link-group ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }
    
    .link-group a {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      font-family: 'Cairo', sans-serif;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      padding: 0.25rem 0;
    }
    
    .link-arrow {
      font-size: 0.75rem;
      opacity: 0;
      transform: translateX(5px);
      transition: all 0.3s ease;
    }
    
    .link-group a:hover {
      color: white;
      transform: translateX(-4px);
    }
    
    .link-group a:hover .link-arrow {
      opacity: 1;
      transform: translateX(0);
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255, 255, 255, 0.7);
      font-family: 'Cairo', sans-serif;
      font-size: 0.9rem;
    }
    
    .contact-item svg {
      width: 16px;
      height: 16px;
      stroke: rgba(255, 255, 255, 0.5);
    }
    
    /* Footer Bottom */
    .footer-bottom {
      background: rgba(0, 0, 0, 0.2);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .footer-bottom-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .copyright {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      font-family: 'Cairo', sans-serif;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
    }
    
    .copyright svg {
      width: 16px;
      height: 16px;
      stroke: rgba(255, 255, 255, 0.5);
    }
    
    .made-with {
      margin: 0;
      font-family: 'Cairo', sans-serif;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.5);
    }
    
    /* Responsive */
    @media (max-width: 900px) {
      .footer-container {
        grid-template-columns: 1fr;
        gap: 2.5rem;
        padding: 2.5rem 1.25rem 1.5rem;
      }
      
      .footer-links {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 600px) {
      .footer-links {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      
      .footer-bottom-container {
        flex-direction: column;
        gap: 0.5rem;
        text-align: center;
      }
      
      .brand-description {
        font-size: 0.85rem;
      }
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
