import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { ApiResponse } from '../../core/models/api-response.model';
import {
  ProfitabilityItem,
  ProfitabilityListData
} from '../../core/models/profitability.model';
import {
  ProfitabilityQueryParams,
  ProfitabilityService
} from './data/profitability.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-profitability',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule
  ],
  templateUrl: './profitability.component.html',
  styleUrl: './profitability.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfitabilityComponent {
  private readonly profitabilityService = inject(ProfitabilityService);
  private readonly notificationService = inject(NotificationService);

  readonly items = signal<ProfitabilityItem[]>([]);
  readonly loading = signal(false);

  readonly totalRecords = signal(0);
  readonly currentPage = signal(1);
  readonly rows = signal(10);

  readonly search = signal('');

  readonly profitableCount = computed(
    () => this.items().filter(item => item.result === 'rentable').length
  );

  readonly riskCount = computed(
    () =>
      this.items().filter(
        item => item.result === 'riesgo' || item.result === 'no_rentable'
      ).length
  );

  readonly averageMargin = computed(() => {
    const list = this.items();
    if (!list.length) return 0;
    return list.reduce((sum, item) => sum + Number(item.margin_percent), 0) / list.length;
  });

  constructor() {
    this.loadProfitability();
  }

  loadProfitability(page = this.currentPage()): void {
    this.loading.set(true);

    const params: ProfitabilityQueryParams = {
      search: this.search(),
      page,
      per_page: this.rows()
    };

    this.profitabilityService
      .getProductProfitability(params)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: ApiResponse<ProfitabilityListData>) => {
          this.items.set(response.data.items);
          this.totalRecords.set(response.data.pagination.total);
          this.currentPage.set(response.data.pagination.current_page);
          this.rows.set(response.data.pagination.per_page);
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al cargar',
            this.getErrorMessage(error) ?? 'No fue posible cargar la rentabilidad.'
          );
        }
      });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
  }

  applyFilters(): void {
    this.loadProfitability(1);
  }

  resetFilters(): void {
    this.search.set('');
    this.loadProfitability(1);
  }

  onPageChange(event: { first: number; rows: number }): void {
    const nextPage = Math.floor(event.first / event.rows) + 1;
    this.rows.set(event.rows);
    this.loadProfitability(nextPage);
  }

  getResultSeverity(result: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (result) {
      case 'rentable':
        return 'success';
      case 'aceptable':
        return 'info';
      case 'riesgo':
        return 'warn';
      case 'no_rentable':
        return 'danger';
      default:
        return 'info';
    }
  }

  private getErrorMessage(error: unknown): string | null {
    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error?: unknown }).error === 'object' &&
      (error as { error?: unknown }).error !== null &&
      'message' in ((error as { error: { message?: unknown } }).error) &&
      typeof (error as { error: { message?: unknown } }).error.message === 'string'
    ) {
      return (error as { error: { message: string } }).error.message;
    }

    return null;
  }
}
