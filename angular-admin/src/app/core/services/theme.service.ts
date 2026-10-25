import { Injectable, signal, effect, inject, RendererFactory2, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'syncspace_admin_theme';
  private readonly document = inject(DOCUMENT);
  private readonly renderer: Renderer2;

  /**
   * Reactive signal exposing whether dark mode is currently active
   */
  readonly isDarkMode = signal<boolean>(this.getInitialThemePreference());

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);

    // Apply the initial theme class to document.body
    this.applyThemeClass(this.isDarkMode());

    // Effect to automatically synchronize DOM class and localStorage when signal changes
    effect(() => {
      const isDark = this.isDarkMode();
      this.applyThemeClass(isDark);
      localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');
    });
  }

  /**
   * Toggle between Dark and Light mode
   */
  toggleTheme(): void {
    this.isDarkMode.update((current) => !current);
  }

  /**
   * Explicitly set dark mode on or off
   */
  setDarkMode(isDark: boolean): void {
    this.isDarkMode.set(isDark);
  }

  /**
   * Internal helper to add or remove .dark class from document.body
   */
  private applyThemeClass(isDark: boolean): void {
    if (this.document && this.document.body) {
      if (isDark) {
        this.renderer.addClass(this.document.body, 'dark');
      } else {
        this.renderer.removeClass(this.document.body, 'dark');
      }
    }
  }

  /**
   * Resolve initial theme state:
   * 1. Check localStorage for user preference
   * 2. Fall back to system OS color scheme (prefers-color-scheme: dark)
   * 3. Default to true (dark theme)
   */
  private getInitialThemePreference(): boolean {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    if (savedTheme) {
      return savedTheme === 'dark';
    }

    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    return true; // Default to dark theme for modern developer console
  }
}
