import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

import { AuthStore } from '../../../core/stores/auth.store';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './app-topbar.component.html',
  styleUrl: './app-topbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppTopbarComponent {
  private readonly authStore = inject(AuthStore);
  readonly themeService = inject(ThemeService);

  readonly menuToggle = output<void>();

  onToggleMenu(): void {
    this.menuToggle.emit();
  }

  onToggleTheme(): void {
    this.themeService.toggleTheme();
  }

  onLogout(): void {
    this.authStore.logout(true).subscribe();
  }
}
