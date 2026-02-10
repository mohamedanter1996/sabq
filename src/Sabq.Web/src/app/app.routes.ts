import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { LobbyComponent } from './components/lobby/lobby.component';
import { GameComponent } from './components/game/game.component';
import { ResultsComponent } from './components/results/results.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'lobby/:code', component: LobbyComponent },
  { path: 'game/:code', component: GameComponent },
  { path: 'results/:code', component: ResultsComponent }
];
