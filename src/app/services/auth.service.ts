import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

export interface LoginResponse {
  accessToken: string;
  user: { id: string; fullName: string; email: string; role: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private key = 'itcs_access';

  // simple auth state for guards/components
  private _authed$ = new BehaviorSubject<boolean>(!!this.token());
  authed$ = this._authed$.asObservable();

  /** Read the current access token (if any) */
  token(): string | null {
    return localStorage.getItem(this.key);
  }

  /** Store token and update state */
  private setToken(token: string) {
    localStorage.setItem(this.key, token);
    this._authed$.next(true);
  }

  /** Clear token and update state */
  private clearToken() {
    localStorage.removeItem(this.key);
    this._authed$.next(false);
  }

  /** Used by existing guards/templates */
  isAuthenticated(): boolean {
    return !!this.token();
  }

  /** App startup helper (called from main.ts) */
  initFromRefresh(): void {
    // If we already have a token, consider authed.
    if (this.token()) {
      this._authed$.next(true);
      return;
    }
    // Try to get a new access token from refresh cookie (if present).
    this.http
      .post<{ accessToken: string }>('/api/auth/refresh', {}, { withCredentials: true })
      .pipe(
        tap(res => this.setToken(res.accessToken)),
        catchError(() => {
          // no cookie / invalid refresh -> stay signed out
          this.clearToken();
          return of(null);
        })
      )
      .subscribe();
  }

  /** Sign in and store access token */
  login(email: string, password: string): Observable<void> {
    return this.http
      .post<LoginResponse>('/api/auth/login', { email, password }, { withCredentials: true })
      .pipe(
        tap(res => this.setToken(res.accessToken)),
        map(() => void 0)
      );
  }

  /** Try to refresh explicitly (used by interceptor) */
  refresh(): Observable<string | null> {
    return this.http
      .post<{ accessToken: string }>('/api/auth/refresh', {}, { withCredentials: true })
      .pipe(
        tap(res => this.setToken(res.accessToken)),
        map(res => res.accessToken),
        catchError(() => {
          this.clearToken();
          return of(null);
        })
      );
  }

  /** Sign out (server + local) */
  logout(): Observable<void> {
    return this.http.post('/api/auth/logout', {}, { withCredentials: true }).pipe(
      tap(() => this.clearToken()),
      map(() => void 0)
    );
  }
}
