import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { LobbyComponent } from './components/lobby/lobby.component';
import { GameComponent } from './components/game/game.component';
import { ResultsComponent } from './components/results/results.component';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent, title: 'سابق - لعبة أسئلة جماعية تفاعلية' },
  { path: 'login', redirectTo: '', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'lobby/:code', component: LobbyComponent },
  { path: 'game/:code', component: GameComponent },
  { path: 'results/:code', component: ResultsComponent },
  {
    path: 'admin/login',
    loadComponent: () => import('./components/admin/admin-login.component').then(m => m.AdminLoginComponent),
    title: 'تسجيل دخول الإدارة | سابق'
  },
  {
    path: 'admin',
    loadComponent: () => import('./components/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [adminGuard],
    title: 'لوحة الإدارة | سابق'
  },
  
  // SEO & Legal Pages (Lazy Loaded)
  {
    path: 'privacy-policy',
    loadComponent: () => import('./components/legal/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
    title: 'سياسة الخصوصية | سابق'
  },
  {
    path: 'terms-and-conditions',
    loadComponent: () => import('./components/legal/terms.component').then(m => m.TermsComponent),
    title: 'الشروط والأحكام | سابق'
  },
  {
    path: 'about',
    loadComponent: () => import('./components/legal/about.component').then(m => m.AboutComponent),
    title: 'من نحن | سابق'
  },
  {
    path: 'contact',
    loadComponent: () => import('./components/legal/contact.component').then(m => m.ContactComponent),
    title: 'تواصل معنا | سابق'
  },
  
  // Questions Pages (SEO)
  {
    path: 'questions',
    loadComponent: () => import('./components/questions/questions-list.component').then(m => m.QuestionsListComponent),
    title: 'الأسئلة | سابق'
  },
  {
    path: 'questions/:category',
    loadComponent: () => import('./components/questions/questions-list.component').then(m => m.QuestionsListComponent)
  },
  {
    path: 'questions/:category/:slug',
    loadComponent: () => import('./components/questions/question-detail.component').then(m => m.QuestionDetailComponent)
  }
];
