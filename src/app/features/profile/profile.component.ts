import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { AuthStore } from '../../core/stores/auth.store';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent {
  readonly authStore = inject(AuthStore);

  readonly user = this.authStore.user;
  readonly roles = this.authStore.roles;
  readonly permissions = this.authStore.permissions;
}
