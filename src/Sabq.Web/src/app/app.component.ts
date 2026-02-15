import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/shared/header.component';
import { FooterComponent } from './components/shared/footer.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div class="app-container">
      @if (!isGameRoute) {
        <app-header></app-header>
      }
      <main class="main-content" [class.game-mode]="isGameRoute">
        <router-outlet></router-outlet>
      </main>
      @if (!isGameRoute) {
        <app-footer></app-footer>
      }
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .main-content {
      flex: 1;
    }
    .main-content.game-mode {
      display: flex;
      flex-direction: column;
    }
  `]
})
export class AppComponent {
  title = 'سابق';
  isGameRoute = false;
  
  private router = inject(Router);
  
  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navEvent = event as NavigationEnd;
        this.isGameRoute = navEvent.urlAfterRedirects.startsWith('/game/');
      });
  }
}
