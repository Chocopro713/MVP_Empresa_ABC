import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkMode = signal(false);

  constructor() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.darkMode.set(true);
      document.body.classList.add('dark-theme');
    }
  }

  isDarkMode() {
    return this.darkMode();
  }

  toggleTheme(): void {
    this.darkMode.update(value => !value);
    
    if (this.darkMode()) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }
}
