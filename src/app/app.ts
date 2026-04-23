import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStore } from './core/stores/auth.store';
import { ThemeService } from './core/services/theme.service';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,ToastModule,ConfirmDialogModule],
  template: `<p-toast position="top-right" /> <p-confirmDialog /><router-outlet />`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly themeService = inject(ThemeService);

  ngOnInit(): void {
    this.themeService.initializeTheme();
    this.authStore.loadMe().subscribe();
  }
}
