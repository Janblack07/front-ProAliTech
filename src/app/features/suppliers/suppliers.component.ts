import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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

import {
  Supplier,
  SupplierPayload
} from '../../core/models/supplier.model';
import {
  SupplierQueryParams,
  SupplierService
} from './data/supplier.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-suppliers',
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
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuppliersComponent {
  private readonly supplierService = inject(SupplierService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmService = inject(ConfirmService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly suppliers = signal<Supplier[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly totalRecords = signal(0);
  readonly currentPage = signal(1);
  readonly rows = signal(10);

  readonly search = signal('');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');

  readonly dialogVisible = signal(false);
  readonly editingSupplier = signal<Supplier | null>(null);

  readonly form = this.fb.group({
    business_name: ['', [Validators.required, Validators.maxLength(150)]],
    ruc: ['', [Validators.maxLength(30)]],
    phone: ['', [Validators.maxLength(20)]],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    address: ['', [Validators.maxLength(250)]],
    status: true
  });

  readonly business_nameControl = this.form.controls.business_name;
  readonly rucControl = this.form.controls.ruc;
  readonly phoneControl = this.form.controls.phone;
  readonly emailControl = this.form.controls.email;
  readonly addressControl = this.form.controls.address;
  readonly statusControl = this.form.controls.status;

  constructor() {
    this.loadSuppliers();
  }

  get isEditMode(): boolean {
    return !!this.editingSupplier();
  }

  get isSubmitDisabled(): boolean {
    return this.form.invalid || this.saving();
  }

  loadSuppliers(page = this.currentPage()): void {
    this.loading.set(true);

    const params: SupplierQueryParams = {
      search: this.search(),
      status: this.statusFilter(),
      page,
      per_page: this.rows()
    };

    this.supplierService
      .getSuppliers(params)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.suppliers.set(response.data.items);
          this.totalRecords.set(response.data.pagination.total);
          this.currentPage.set(response.data.pagination.current_page);
          this.rows.set(response.data.pagination.per_page);
        },
        error: (error) => {
          this.notificationService.error(
            'Error al cargar',
            error?.error?.message ?? 'No fue posible cargar los proveedores.'
          );
        }
      });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
  }

  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.statusFilter.set(value);
    this.loadSuppliers(1);
  }

  applyFilters(): void {
    this.loadSuppliers(1);
  }

  resetFilters(): void {
    this.search.set('');
    this.statusFilter.set('all');
    this.loadSuppliers(1);
  }

  onPageChange(event: { first: number; rows: number }): void {
    const nextPage = Math.floor(event.first / event.rows) + 1;
    this.rows.set(event.rows);
    this.loadSuppliers(nextPage);
  }

  openCreateDialog(): void {
    this.editingSupplier.set(null);
    this.form.reset({
      business_name: '',
      ruc: '',
      phone: '',
      email: '',
      address: '',
      status: true
    });
    this.dialogVisible.set(true);
  }

  openEditDialog(supplier: Supplier): void {
    this.editingSupplier.set(supplier);
    this.form.reset({
      business_name: supplier.business_name,
      ruc: supplier.ruc ?? '',
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      status: supplier.status
    });
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.editingSupplier.set(null);
    this.form.reset({
      business_name: '',
      ruc: '',
      phone: '',
      email: '',
      address: '',
      status: true
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.warn(
        'Formulario incompleto',
        'Revisa los campos obligatorios antes de continuar.'
      );
      return;
    }

    this.saving.set(true);

    const raw = this.form.getRawValue();

    const payload: SupplierPayload = {
      business_name: raw.business_name.trim(),
      ruc: raw.ruc?.trim() ? raw.ruc.trim() : null,
      phone: raw.phone?.trim() ? raw.phone.trim() : null,
      email: raw.email?.trim() ? raw.email.trim() : null,
      address: raw.address?.trim() ? raw.address.trim() : null,
      status: raw.status
    };

    const request$ = this.isEditMode
      ? this.supplierService.updateSupplier(this.editingSupplier()!.id, payload)
      : this.supplierService.createSupplier(payload);

    request$
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (response) => {
          this.notificationService.success(
            this.isEditMode ? 'Proveedor actualizado' : 'Proveedor creado',
            response.message
          );
          this.closeDialog();
          this.loadSuppliers(this.currentPage());
        },
        error: (error) => {
          this.notificationService.error(
            'Error al guardar',
            error?.error?.message ?? 'No fue posible guardar el proveedor.'
          );
        }
      });
  }

  deleteSupplier(supplier: Supplier): void {
    this.confirmService.confirmDelete({
      message: `¿Deseas eliminar el proveedor "${supplier.business_name}"? Esta acción no se puede deshacer.`,
      accept: () => {
        this.loading.set(true);

        this.supplierService
          .deleteSupplier(supplier.id)
          .pipe(finalize(() => this.loading.set(false)))
          .subscribe({
            next: (response) => {
              this.notificationService.success(
                'Proveedor eliminado',
                response.message
              );
              this.loadSuppliers(this.currentPage());
            },
            error: (error) => {
              this.notificationService.error(
                'Error al eliminar',
                error?.error?.message ?? 'No fue posible eliminar el proveedor.'
              );
            }
          });
      }
    });
  }
}
