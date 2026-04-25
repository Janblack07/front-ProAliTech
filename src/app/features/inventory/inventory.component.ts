import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { finalize } from 'rxjs';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';

import { ApiResponse } from '../../core/models/api-response.model';
import {
  AdjustInventoryPayload,
  Inventory,
  InventoryListData,
  InventoryMovement,
  InventoryMovementListData
} from '../../core/models/inventory.model';
import {
  InventoryQueryParams,
  InventoryService
} from './data/inventory.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
    TagModule,
    TextareaModule
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryComponent {
  private readonly inventoryService = inject(InventoryService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly inventories = signal<Inventory[]>([]);
  readonly selectedInventory = signal<Inventory | null>(null);
  readonly movements = signal<InventoryMovement[]>([]);

  readonly loading = signal(false);
  readonly savingAdjustment = signal(false);
  readonly loadingMovements = signal(false);

  readonly totalRecords = signal(0);
  readonly currentPage = signal(1);
  readonly rows = signal(10);

  readonly movementTotalRecords = signal(0);
  readonly movementCurrentPage = signal(1);
  readonly movementRows = signal(10);

  readonly search = signal('');
  readonly inventoryTypeFilter = signal<'all' | 'product' | 'raw_material'>('all');
  readonly lowStockFilter = signal(false);

  readonly detailDialogVisible = signal(false);
  readonly movementsDialogVisible = signal(false);
  readonly adjustDialogVisible = signal(false);

  readonly adjustForm = this.fb.group({
    movement_type: ['adjustment' as 'entry' | 'exit' | 'adjustment' | 'waste' | 'return', [Validators.required]],
    quantity: [0, [Validators.required, Validators.min(0.01)]],
    description: ['']
  });

  constructor() {
    this.loadInventories();
  }

  get isAdjustSubmitDisabled(): boolean {
    return this.adjustForm.invalid || this.savingAdjustment() || !this.selectedInventory();
  }

  loadInventories(page = this.currentPage()): void {
    this.loading.set(true);

    const params: InventoryQueryParams = {
      search: this.search(),
      inventory_type: this.inventoryTypeFilter(),
      low_stock: this.lowStockFilter(),
      page,
      per_page: this.rows()
    };

    this.inventoryService
      .getInventories(params)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: ApiResponse<InventoryListData>) => {
          this.inventories.set(response.data.items);
          this.totalRecords.set(response.data.pagination.total);
          this.currentPage.set(response.data.pagination.current_page);
          this.rows.set(response.data.pagination.per_page);
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al cargar',
            this.getErrorMessage(error) ?? 'No fue posible cargar el inventario.'
          );
        }
      });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
  }

  onInventoryTypeFilterChange(value: 'all' | 'product' | 'raw_material'): void {
    this.inventoryTypeFilter.set(value);
  }

  onLowStockFilterChange(value: boolean): void {
    this.lowStockFilter.set(value);
  }

  applyFilters(): void {
    this.loadInventories(1);
  }

  resetFilters(): void {
    this.search.set('');
    this.inventoryTypeFilter.set('all');
    this.lowStockFilter.set(false);
    this.loadInventories(1);
  }

  onPageChange(event: { first: number; rows: number }): void {
    const nextPage = Math.floor(event.first / event.rows) + 1;
    this.rows.set(event.rows);
    this.loadInventories(nextPage);
  }

  openDetailDialog(inventory: Inventory): void {
    this.selectedInventory.set(null);
    this.detailDialogVisible.set(true);

    this.inventoryService.getInventory(inventory.id).subscribe({
      next: (response: ApiResponse<Inventory>) => {
        this.selectedInventory.set(response.data);
      },
      error: (error: unknown) => {
        this.notificationService.error(
          'Error al cargar detalle',
          this.getErrorMessage(error) ?? 'No fue posible cargar el detalle del inventario.'
        );
        this.detailDialogVisible.set(false);
      }
    });
  }

  closeDetailDialog(): void {
    this.detailDialogVisible.set(false);
    this.selectedInventory.set(null);
  }

  openMovementsDialog(inventory: Inventory): void {
    this.selectedInventory.set(inventory);
    this.movementsDialogVisible.set(true);
    this.loadMovements(1);
  }

  closeMovementsDialog(): void {
    this.movementsDialogVisible.set(false);
    this.movements.set([]);
    this.selectedInventory.set(null);
  }

  loadMovements(page = this.movementCurrentPage()): void {
    const inventory = this.selectedInventory();
    if (!inventory) return;

    this.loadingMovements.set(true);

    this.inventoryService
      .getInventoryMovements(inventory.id, page, this.movementRows())
      .pipe(finalize(() => this.loadingMovements.set(false)))
      .subscribe({
        next: (response: ApiResponse<InventoryMovementListData>) => {
          this.movements.set(response.data.items);
          this.movementTotalRecords.set(response.data.pagination.total);
          this.movementCurrentPage.set(response.data.pagination.current_page);
          this.movementRows.set(response.data.pagination.per_page);
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al cargar movimientos',
            this.getErrorMessage(error) ?? 'No fue posible cargar los movimientos.'
          );
        }
      });
  }

  onMovementPageChange(event: { first: number; rows: number }): void {
    const nextPage = Math.floor(event.first / event.rows) + 1;
    this.movementRows.set(event.rows);
    this.loadMovements(nextPage);
  }

  openAdjustDialog(inventory: Inventory): void {
    this.selectedInventory.set(inventory);
    this.adjustForm.reset({
      movement_type: 'adjustment',
      quantity: 0,
      description: ''
    });
    this.adjustDialogVisible.set(true);
  }

  closeAdjustDialog(): void {
    this.adjustDialogVisible.set(false);
    this.selectedInventory.set(null);
  }

  submitAdjustment(): void {
    if (this.adjustForm.invalid || !this.selectedInventory()) {
      this.adjustForm.markAllAsTouched();
      this.notificationService.warn(
        'Formulario incompleto',
        'Revisa los campos obligatorios antes de continuar.'
      );
      return;
    }

    this.savingAdjustment.set(true);

    const inventory = this.selectedInventory()!;
    const raw = this.adjustForm.getRawValue();

    const payload: AdjustInventoryPayload = {
      movement_type: raw.movement_type,
      quantity: Number(raw.quantity),
      description: raw.description?.trim() ? raw.description.trim() : null
    };

    this.inventoryService
      .adjustInventory(inventory.id, payload)
      .pipe(finalize(() => this.savingAdjustment.set(false)))
      .subscribe({
        next: (response: ApiResponse<Inventory>) => {
          this.notificationService.success(
            'Inventario ajustado',
            response.message
          );
          this.closeAdjustDialog();
          this.loadInventories(this.currentPage());
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al ajustar',
            this.getErrorMessage(error) ?? 'No fue posible ajustar el inventario.'
          );
        }
      });
  }

  getInventoryTypeLabel(type: Inventory['inventory_type']): string {
    return type === 'product' ? 'Producto' : 'Materia prima';
  }

  getMovementTypeLabel(type: InventoryMovement['movement_type']): string {
    switch (type) {
      case 'entry': return 'Entrada';
      case 'exit': return 'Salida';
      case 'adjustment': return 'Ajuste';
      case 'waste': return 'Merma';
      case 'return': return 'Devolución';
      default: return type;
    }
  }

  getMovementSeverity(type: InventoryMovement['movement_type']): 'success' | 'info' | 'warn' | 'danger' {
    switch (type) {
      case 'entry': return 'success';
      case 'return': return 'info';
      case 'adjustment': return 'warn';
      case 'waste': return 'danger';
      case 'exit': return 'danger';
      default: return 'info';
    }
  }

  private getErrorMessage(error: unknown): string | null {
    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof error.error === 'object' &&
      error.error !== null &&
      'message' in error.error &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    return null;
  }
}
