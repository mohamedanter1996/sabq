import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
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
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private authState = new BehaviorSubject<AuthState>(this.loadInitialState());

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
    if (this.isBrowser) {
      sessionStorage.setItem('playerId', playerId);
      sessionStorage.setItem('displayName', displayName);
      sessionStorage.setItem('token', token);
    }
    
    this.authState.next({ playerId, displayName, token });
  }

  clearAuth(): void {
    if (this.isBrowser) {
      sessionStorage.removeItem('playerId');
      sessionStorage.removeItem('displayName');
      sessionStorage.removeItem('token');
    }
    
    this.authState.next({ playerId: null, displayName: null, token: null });
  }

  private loadInitialState(): AuthState {
    if (!this.isBrowser) {
      return { playerId: null, displayName: null, token: null };
    }

    return {
      playerId: sessionStorage.getItem('playerId'),
      displayName: sessionStorage.getItem('displayName'),
      token: sessionStorage.getItem('token')
    };
  }
}
