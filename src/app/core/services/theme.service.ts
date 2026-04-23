import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

import { AppThemeMode, THEME_STORAGE_KEY } from '../constants/theme.constant';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  readonly theme = signal<AppThemeMode>('light');

  initializeTheme(): void {
    const savedTheme = this.getStoredTheme();

    if (savedTheme) {
      this.applyTheme(savedTheme);
      return;
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.applyTheme(prefersDark ? 'dark' : 'light');
  }

  toggleTheme(): void {
    const nextTheme: AppThemeMode = this.theme() === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
  }

  setTheme(mode: AppThemeMode): void {
    this.applyTheme(mode);
  }

  private applyTheme(mode: AppThemeMode): void {
    this.theme.set(mode);

    const element = this.document.documentElement;

    if (mode === 'dark') {
      element.classList.add('app-dark');
    } else {
      element.classList.remove('app-dark');
    }

    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }

  private getStoredTheme(): AppThemeMode | null {
    const value = localStorage.getItem(THEME_STORAGE_KEY);

    if (value === 'light' || value === 'dark') {
      return value;
    }

    return null;
  }
}
