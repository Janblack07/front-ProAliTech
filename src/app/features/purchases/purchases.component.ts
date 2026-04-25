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
  Purchase,
  PurchaseDetailPayload,
  PurchaseListData,
  PurchasePayload
} from '../../core/models/purchase.model';
import { PurchaseQueryParams, PurchaseService } from './data/purchase.service';
import { SupplierService } from '../suppliers/data/supplier.service';
import { RawMaterialService } from '../raw-materials/data/raw-material.service';
import { NotificationService } from '../../core/services/notification.service';

type PurchaseDetailForm = FormGroup<{
  raw_material_id: FormControl<number | null>;
  quantity: FormControl<number>;
  unit_price: FormControl<number>;
  expiration_date: FormControl<string>;
  batch_number: FormControl<string>;
}>;

@Component({
  selector: 'app-purchases',
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
  templateUrl: './purchases.component.html',
  styleUrl: './purchases.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PurchasesComponent {
  private readonly purchaseService = inject(PurchaseService);
  private readonly supplierService = inject(SupplierService);
  private readonly rawMaterialService = inject(RawMaterialService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly purchases = signal<Purchase[]>([]);
  readonly supplierOptions = signal<Array<{ id: number; business_name: string }>>([]);
  readonly rawMaterialOptions = signal<Array<{ id: number; name: string; code: string; unit_measure: string }>>([]);

  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly totalRecords = signal(0);
  readonly currentPage = signal(1);
  readonly rows = signal(10);

  readonly search = signal('');
  readonly statusFilter = signal('');

  readonly dialogVisible = signal(false);
  readonly viewDialogVisible = signal(false);
  readonly selectedPurchase = signal<Purchase | null>(null);

  readonly form = this.fb.group({
    supplier_id: [null as number | null, [Validators.required]],
    purchase_date: ['', [Validators.required]],
    invoice_number: [''],
    tax: [0],
    notes: [''],
    details: this.fb.array<PurchaseDetailForm>([])
  });

  readonly supplierIdControl = this.form.controls.supplier_id;
  readonly purchaseDateControl = this.form.controls.purchase_date;

  constructor() {
    this.loadPurchases();
    this.loadOptions();
  }

  get details(): FormArray<PurchaseDetailForm> {
    return this.form.controls.details;
  }

  get isSubmitDisabled(): boolean {
    return this.form.invalid || this.saving() || this.details.length === 0;
  }

  private createDetailGroup(detail?: {
    raw_material_id?: number | null;
    quantity?: number;
    unit_price?: number;
    expiration_date?: string;
    batch_number?: string;
  }): PurchaseDetailForm {
    return this.fb.group({
      raw_material_id: [detail?.raw_material_id ?? null, [Validators.required]],
      quantity: [detail?.quantity ?? 0, [Validators.required, Validators.min(0.01)]],
      unit_price: [detail?.unit_price ?? 0, [Validators.required, Validators.min(0)]],
      expiration_date: [detail?.expiration_date ?? ''],
      batch_number: [detail?.batch_number ?? '']
    });
  }

  addDetail(detail?: {
    raw_material_id?: number | null;
    quantity?: number;
    unit_price?: number;
    expiration_date?: string;
    batch_number?: string;
  }): void {
    this.details.push(this.createDetailGroup(detail));
  }

  removeDetail(index: number): void {
    this.details.removeAt(index);
  }

  loadPurchases(page = this.currentPage()): void {
    this.loading.set(true);

    const params: PurchaseQueryParams = {
      search: this.search(),
      status: this.statusFilter() || null,
      page,
      per_page: this.rows()
    };

    this.purchaseService
      .getPurchases(params)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: ApiResponse<PurchaseListData>) => {
          this.purchases.set(response.data.items);
          this.totalRecords.set(response.data.pagination.total);
          this.currentPage.set(response.data.pagination.current_page);
          this.rows.set(response.data.pagination.per_page);
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al cargar',
            this.getErrorMessage(error) ?? 'No fue posible cargar las compras.'
          );
        }
      });
  }

  loadOptions(): void {
    this.supplierService.getActiveSuppliers().subscribe({
      next: (response: ApiResponse<Array<{ id: number; business_name: string }>>) => {
        this.supplierOptions.set(response.data);
      }
    });

    this.rawMaterialService.getActiveRawMaterials().subscribe({
      next: (response: ApiResponse<Array<{ id: number; name: string; code: string; unit_measure: string }>>) => {
        this.rawMaterialOptions.set(response.data);
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
    this.loadPurchases(1);
  }

  resetFilters(): void {
    this.search.set('');
    this.statusFilter.set('');
    this.loadPurchases(1);
  }

  onPageChange(event: { first: number; rows: number }): void {
    const nextPage = Math.floor(event.first / event.rows) + 1;
    this.rows.set(event.rows);
    this.loadPurchases(nextPage);
  }

  openCreateDialog(): void {
    this.form.reset({
      supplier_id: null,
      purchase_date: '',
      invoice_number: '',
      tax: 0,
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

  openViewDialog(purchase: Purchase): void {
    this.selectedPurchase.set(null);
    this.viewDialogVisible.set(true);

    this.purchaseService.getPurchase(purchase.id).subscribe({
      next: (response: ApiResponse<Purchase>) => {
        this.selectedPurchase.set(response.data);
      },
      error: (error: unknown) => {
        this.notificationService.error(
          'Error al cargar detalle',
          this.getErrorMessage(error) ?? 'No fue posible cargar el detalle de la compra.'
        );
        this.viewDialogVisible.set(false);
      }
    });
  }

  closeViewDialog(): void {
    this.viewDialogVisible.set(false);
    this.selectedPurchase.set(null);
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

    const details: PurchaseDetailPayload[] = raw.details.map(detail => ({
      raw_material_id: Number(detail.raw_material_id),
      quantity: Number(detail.quantity),
      unit_price: Number(detail.unit_price),
      expiration_date: detail.expiration_date?.trim() ? detail.expiration_date : null,
      batch_number: detail.batch_number?.trim() ? detail.batch_number.trim() : null
    }));

    const payload: PurchasePayload = {
      supplier_id: Number(raw.supplier_id),
      purchase_date: raw.purchase_date,
      invoice_number: raw.invoice_number?.trim() ? raw.invoice_number.trim() : null,
      tax: raw.tax === null || raw.tax === undefined ? null : Number(raw.tax),
      notes: raw.notes?.trim() ? raw.notes.trim() : null,
      details
    };

    this.purchaseService
      .createPurchase(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (response: ApiResponse<Purchase>) => {
          this.notificationService.success(
            'Compra registrada',
            response.message
          );
          this.closeDialog();
          this.loadPurchases(this.currentPage());
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al guardar',
            this.getErrorMessage(error) ?? 'No fue posible registrar la compra.'
          );
        }
      });
  }

  calculateDetailSubtotal(index: number): number {
    const detail = this.details.at(index).getRawValue();
    return Number(detail.quantity || 0) * Number(detail.unit_price || 0);
  }

  calculateSubtotal(): number {
    return this.details.controls.reduce((sum, _, index) => sum + this.calculateDetailSubtotal(index), 0);
  }

  calculateTotal(): number {
    return this.calculateSubtotal() + Number(this.form.controls.tax.value || 0);
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
