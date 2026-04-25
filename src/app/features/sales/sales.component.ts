import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormControl,
  FormGroup,
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
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';

import { ApiResponse } from '../../core/models/api-response.model';
import {
  Sale,
  SaleDetailPayload,
  SaleListData,
  SalePayload
} from '../../core/models/sale.model';
import { SaleQueryParams, SaleService } from './data/sale.service';
import { ProductService } from '../products/data/product.service';
import { NotificationService } from '../../core/services/notification.service';

type SaleDetailForm = FormGroup<{
  product_id: FormControl<number | null>;
  quantity: FormControl<number>;
  unit_price: FormControl<number>;
  discount: FormControl<number | null>;
}>;

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    TagModule
  ],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesComponent {
  private readonly saleService = inject(SaleService);
  private readonly productService = inject(ProductService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly sales = signal<Sale[]>([]);
  readonly productOptions = signal<Array<{ id: number; name: string; code: string }>>([]);

  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly totalRecords = signal(0);
  readonly currentPage = signal(1);
  readonly rows = signal(10);

  readonly search = signal('');
  readonly statusFilter = signal('');

  readonly dialogVisible = signal(false);
  readonly viewDialogVisible = signal(false);
  readonly selectedSale = signal<Sale | null>(null);

  readonly form = this.fb.group({
    sale_date: ['', [Validators.required]],
    invoice_number: [''],
    customer_name: [''],
    customer_document: [''],
    tax: [0],
    discount: [0],
    notes: [''],
    details: this.fb.array<SaleDetailForm>([])
  });

  constructor() {
    this.loadSales();
    this.loadProductOptions();
  }

  get details(): FormArray<SaleDetailForm> {
    return this.form.controls.details;
  }

  get isSubmitDisabled(): boolean {
    return this.form.invalid || this.saving() || this.details.length === 0;
  }

  private createDetailGroup(detail?: {
  product_id?: number | null;
  quantity?: number;
  unit_price?: number;
  discount?: number | null;
}): SaleDetailForm {
  return new FormGroup({
    product_id: new FormControl<number | null>(
      detail?.product_id ?? null,
      { validators: [Validators.required] }
    ),
    quantity: new FormControl<number>(
      detail?.quantity ?? 0,
      { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] }
    ),
    unit_price: new FormControl<number>(
      detail?.unit_price ?? 0,
      { nonNullable: true, validators: [Validators.required, Validators.min(0)] }
    ),
    discount: new FormControl<number | null>(
      detail?.discount ?? 0
    )
  });
}

  addDetail(detail?: {
    product_id?: number | null;
    quantity?: number;
    unit_price?: number;
    discount?: number | null;
  }): void {
    this.details.push(this.createDetailGroup(detail));
  }

  removeDetail(index: number): void {
    this.details.removeAt(index);
  }

  loadSales(page = this.currentPage()): void {
    this.loading.set(true);

    const params: SaleQueryParams = {
      search: this.search(),
      status: this.statusFilter() || null,
      page,
      per_page: this.rows()
    };

    this.saleService
      .getSales(params)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: ApiResponse<SaleListData>) => {
          this.sales.set(response.data.items);
          this.totalRecords.set(response.data.pagination.total);
          this.currentPage.set(response.data.pagination.current_page);
          this.rows.set(response.data.pagination.per_page);
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al cargar',
            this.getErrorMessage(error) ?? 'No fue posible cargar las ventas.'
          );
        }
      });
  }

  loadProductOptions(): void {
    this.productService.getActiveProducts().subscribe({
      next: (response: ApiResponse<Array<{ id: number; name: string; code: string }>>) => {
        this.productOptions.set(response.data);
      }
    });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter.set(value);
  }

  applyFilters(): void {
    this.loadSales(1);
  }

  resetFilters(): void {
    this.search.set('');
    this.statusFilter.set('');
    this.loadSales(1);
  }

  onPageChange(event: { first: number; rows: number }): void {
    const nextPage = Math.floor(event.first / event.rows) + 1;
    this.rows.set(event.rows);
    this.loadSales(nextPage);
  }

  openCreateDialog(): void {
    this.form.reset({
      sale_date: '',
      invoice_number: '',
      customer_name: '',
      customer_document: '',
      tax: 0,
      discount: 0,
      notes: ''
    });

    this.details.clear();
    this.addDetail();
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.details.clear();
  }

  openViewDialog(sale: Sale): void {
    this.selectedSale.set(null);
    this.viewDialogVisible.set(true);

    this.saleService.getSale(sale.id).subscribe({
      next: (response: ApiResponse<Sale>) => {
        this.selectedSale.set(response.data);
      },
      error: (error: unknown) => {
        this.notificationService.error(
          'Error al cargar detalle',
          this.getErrorMessage(error) ?? 'No fue posible cargar el detalle de la venta.'
        );
        this.viewDialogVisible.set(false);
      }
    });
  }

  closeViewDialog(): void {
    this.viewDialogVisible.set(false);
    this.selectedSale.set(null);
  }

  submit(): void {
    if (this.form.invalid || this.details.length === 0) {
      this.form.markAllAsTouched();
      this.details.controls.forEach(control => control.markAllAsTouched());

      this.notificationService.warn(
        'Formulario incompleto',
        'Revisa los campos obligatorios y agrega al menos un detalle.'
      );
      return;
    }

    this.saving.set(true);

    const raw = this.form.getRawValue();

    const details: SaleDetailPayload[] = raw.details.map(detail => ({
      product_id: Number(detail.product_id),
      quantity: Number(detail.quantity),
      unit_price: Number(detail.unit_price),
      discount:
        detail.discount === null || detail.discount === undefined
          ? null
          : Number(detail.discount)
    }));

    const payload: SalePayload = {
      sale_date: raw.sale_date,
      invoice_number: raw.invoice_number?.trim() ? raw.invoice_number.trim() : null,
      customer_name: raw.customer_name?.trim() ? raw.customer_name.trim() : null,
      customer_document: raw.customer_document?.trim() ? raw.customer_document.trim() : null,
      tax: raw.tax === null || raw.tax === undefined ? null : Number(raw.tax),
      discount: raw.discount === null || raw.discount === undefined ? null : Number(raw.discount),
      notes: raw.notes?.trim() ? raw.notes.trim() : null,
      details
    };

    this.saleService
      .createSale(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (response: ApiResponse<Sale>) => {
          this.notificationService.success(
            'Venta registrada',
            response.message
          );
          this.closeDialog();
          this.loadSales(this.currentPage());
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al guardar',
            this.getErrorMessage(error) ?? 'No fue posible registrar la venta.'
          );
        }
      });
  }

  calculateDetailSubtotal(index: number): number {
    const detail = this.details.at(index).getRawValue();
    return (Number(detail.quantity || 0) * Number(detail.unit_price || 0)) - Number(detail.discount || 0);
  }

  calculateSubtotal(): number {
    return this.details.controls.reduce((sum, _, index) => sum + this.calculateDetailSubtotal(index), 0);
  }

  calculateTotal(): number {
    return this.calculateSubtotal() + Number(this.form.controls.tax.value || 0) - Number(this.form.controls.discount.value || 0);
  }

  getStatusSeverity(status: Sale['status']): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'registered': return 'success';
      case 'pending': return 'warn';
      case 'cancelled': return 'danger';
      case 'paid': return 'info';
      default: return 'info';
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
