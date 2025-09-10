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

  /** Save token + update state */
  private setToken(token: string | null) {
    if (token) localStorage.setItem(this.key, token);
    else localStorage.removeItem(this.key);
    this._authed$.next(!!token);
  }

  /** Is user authenticated (fast check) */
  isAuthenticated(): boolean {
    return !!this.token();
  }

  /** Login and store token */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }, { withCredentials: true })
      .pipe(
        tap(res => this.setToken(res.accessToken))
      );
  }

  /**
   * Try to initialize session from refresh cookie on app startup.
   * Safe to call unconditionally; it silently fails if no refresh cookie.
   */
  initFromRefresh(): void {
    // Only attempt if we don't already have an access token
    if (!this.token()) {
      this.refresh().subscribe(() => {
        // no-op: state is handled inside refresh()
      });
    }
  }

  /** Refresh (rotate) access token using httpOnly refresh cookie */
  refresh(): Observable<string | null> {
    return this.http.post<{ accessToken: string }>('/api/auth/refresh', {}, { withCredentials: true })
      .pipe(
        map(res => res?.accessToken || null),
        tap(token => this.setToken(token)),
        catchError(() => of(null))
      );
  }

  /** Get current user profile (requires valid access token) */
  me(): Observable<{ user: { id: string; fullName: string; email: string; role: string } }> {
    return this.http.get<{ user: { id: string; fullName: string; email: string; role: string } }>(
      '/api/auth/me'
    );
  }

  /** Clear token only */
  private clearToken() {
    this.setToken(null);
  }

  /** Sign out (server + local) */
  logout(): Observable<void> {
    return this.http.post('/api/auth/logout', {}, { withCredentials: true }).pipe(
      tap(() => this.clearToken()),
      map(() => void 0)
    );
  }
}
