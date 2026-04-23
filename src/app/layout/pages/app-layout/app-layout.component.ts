
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { AppTopbarComponent } from './../../components/app-topbar/app-topbar.component';
import { AppSidebarComponent } from '../../components/app-sidebar/app-sidebar.component';


@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, NgClass, AppTopbarComponent, AppSidebarComponent],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppLayoutComponent {
  readonly sidebarCollapsed = signal(false);

  toggleSidebar(): void {
    this.sidebarCollapsed.update((value) => !value);
  }
}
