import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, tap, throwError } from 'rxjs';

import { STORAGE_KEYS } from '../constants/storage.constant';
import { AuthSession, LoginRequest } from '../models/auth.model';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  private readonly authService = inject(AuthService);
  private readonly storageService = inject(StorageService);
  private readonly router = inject(Router);

  readonly session = signal<AuthSession | null>(
    this.storageService.getItem<AuthSession>(STORAGE_KEYS.authSession)
  );

  readonly loading = signal(false);
  readonly initialized = signal(false);

  readonly isAuthenticated = computed(() => {
    const currentSession = this.session();
    return !!currentSession?.token;
  });

  readonly user = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly roles = computed(() => this.session()?.roles ?? []);
  readonly permissions = computed(() => this.session()?.permissions ?? []);

  login(payload: LoginRequest): Observable<void> {
    this.loading.set(true);

    return this.authService.login(payload).pipe(
      tap((response) => {
        const session: AuthSession = {
          token: response.data.token,
          tokenType: response.data.token_type,
          user: response.data.user,
          roles: response.data.roles,
          permissions: response.data.permissions
        };

        this.session.set(session);
        this.storageService.setItem(STORAGE_KEYS.authSession, session);
      }),
      map(() => void 0),
      finalize(() => this.loading.set(false)),
      catchError((error) => {
        this.clearSession(false);
        return throwError(() => error);
      })
    );
  }

  loadMe(): Observable<boolean> {
    const currentToken = this.token();

    if (!currentToken) {
      this.initialized.set(true);
      return of(false);
    }

    this.loading.set(true);

    return this.authService.me().pipe(
      tap((response) => {
        const current = this.session();
        if (!current) return;

        const updatedSession: AuthSession = {
          ...current,
          user: response.data.user,
          roles: response.data.roles,
          permissions: response.data.permissions
        };

        this.session.set(updatedSession);
        this.storageService.setItem(STORAGE_KEYS.authSession, updatedSession);
      }),
      map(() => true),
      catchError(() => {
        this.clearSession(false);
        return of(false);
      }),
      finalize(() => {
        this.loading.set(false);
        this.initialized.set(true);
      })
    );
  }

  logout(redirect = true): Observable<void> {
    this.loading.set(true);

    return this.authService.logout().pipe(
      tap(() => this.clearSession(redirect)),
      map(() => void 0),
      catchError(() => {
        this.clearSession(redirect);
        return of(void 0);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  clearSession(redirect = true): void {
    this.session.set(null);
    this.storageService.removeItem(STORAGE_KEYS.authSession);

    if (redirect) {
      void this.router.navigateByUrl('/auth/login');
    }
  }
}
