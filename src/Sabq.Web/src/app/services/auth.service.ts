import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AuthState {
  playerId: string | null;
  displayName: string | null;
  token: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = new BehaviorSubject<AuthState>({
    playerId: localStorage.getItem('playerId'),
    displayName: localStorage.getItem('displayName'),
    token: localStorage.getItem('token')
  });

  authState$ = this.authState.asObservable();

  get isLoggedIn(): boolean {
    const state = this.authState.value;
    return !!(state.token && state.playerId);
  }

  get token(): string | null {
    return this.authState.value.token;
  }

  get playerId(): string | null {
    return this.authState.value.playerId;
  }

  setAuth(playerId: string, displayName: string, token: string): void {
    localStorage.setItem('playerId', playerId);
    localStorage.setItem('displayName', displayName);
    localStorage.setItem('token', token);
    
    this.authState.next({ playerId, displayName, token });
  }

  clearAuth(): void {
    localStorage.removeItem('playerId');
    localStorage.removeItem('displayName');
    localStorage.removeItem('token');
    
    this.authState.next({ playerId: null, displayName: null, token: null });
  }
}
