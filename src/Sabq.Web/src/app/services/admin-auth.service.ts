import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AdminAuthState {
  username: string | null;
  token: string | null;
  expiresAtUtc: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly tokenKey = 'adminToken';
  private readonly usernameKey = 'adminUsername';
  private readonly expiresAtKey = 'adminExpiresAtUtc';
  private authState = new BehaviorSubject<AdminAuthState>(this.loadInitialState());

  authState$ = this.authState.asObservable();

  get isAdminLoggedIn(): boolean {
    const state = this.authState.value;
    if (!state.token || this.isExpired(state.expiresAtUtc)) {
      this.clearAdminAuth();
      return false;
    }

    return true;
  }

  get token(): string | null {
    return this.isAdminLoggedIn ? this.authState.value.token : null;
  }

  get username(): string | null {
    return this.authState.value.username;
  }

  setAdminAuth(token: string, username: string, expiresAtUtc: string): void {
    if (this.isBrowser) {
      sessionStorage.setItem(this.tokenKey, token);
      sessionStorage.setItem(this.usernameKey, username);
      sessionStorage.setItem(this.expiresAtKey, expiresAtUtc);
    }

    this.authState.next({ token, username, expiresAtUtc });
  }

  clearAdminAuth(): void {
    if (this.isBrowser) {
      sessionStorage.removeItem(this.tokenKey);
      sessionStorage.removeItem(this.usernameKey);
      sessionStorage.removeItem(this.expiresAtKey);
    }

    this.authState.next({ username: null, token: null, expiresAtUtc: null });
  }

  private loadInitialState(): AdminAuthState {
    if (!this.isBrowser) {
      return { username: null, token: null, expiresAtUtc: null };
    }

    const state: AdminAuthState = {
      username: sessionStorage.getItem(this.usernameKey),
      token: sessionStorage.getItem(this.tokenKey),
      expiresAtUtc: sessionStorage.getItem(this.expiresAtKey)
    };

    if (!state.token || this.isExpired(state.expiresAtUtc)) {
      sessionStorage.removeItem(this.tokenKey);
      sessionStorage.removeItem(this.usernameKey);
      sessionStorage.removeItem(this.expiresAtKey);
      return { username: null, token: null, expiresAtUtc: null };
    }

    return state;
  }

  private isExpired(expiresAtUtc: string | null): boolean {
    if (!expiresAtUtc) {
      return true;
    }

    const expiresAt = Date.parse(expiresAtUtc);
    return Number.isNaN(expiresAt) || expiresAt <= Date.now();
  }
}
