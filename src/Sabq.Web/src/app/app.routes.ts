import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { LobbyComponent } from './components/lobby/lobby.component';
import { GameComponent } from './components/game/game.component';
import { ResultsComponent } from './components/results/results.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, title: 'الرئيسية  | سابق' },
  { path: 'home', component: HomeComponent },
  { path: 'lobby/:code', component: LobbyComponent },
  { path: 'game/:code', component: GameComponent },
  { path: 'results/:code', component: ResultsComponent },
  
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
