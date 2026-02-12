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
    playerId: sessionStorage.getItem('playerId'),
    displayName: sessionStorage.getItem('displayName'),
    token: sessionStorage.getItem('token')
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

  get displayName(): string | null {
    return this.authState.value.displayName;
  }

  setAuth(playerId: string, displayName: string, token: string): void {
    sessionStorage.setItem('playerId', playerId);
    sessionStorage.setItem('displayName', displayName);
    sessionStorage.setItem('token', token);
    
    this.authState.next({ playerId, displayName, token });
  }

  clearAuth(): void {
    sessionStorage.removeItem('playerId');
    sessionStorage.removeItem('displayName');
    sessionStorage.removeItem('token');
    
    this.authState.next({ playerId: null, displayName: null, token: null });
  }
}
