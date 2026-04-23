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
  RawMaterial,
  RawMaterialListData,
  RawMaterialPayload,
  RawMaterialSupplierOption
} from '../../core/models/raw-material.model';
import {
  RawMaterialQueryParams,
  RawMaterialService
} from './data/raw-material.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { SupplierService } from '../suppliers/data/supplier.service';

@Component({
  selector: 'app-raw-materials',
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
  templateUrl: './raw-materials.component.html',
  styleUrl: './raw-materials.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RawMaterialsComponent {
  private readonly rawMaterialService = inject(RawMaterialService);
  private readonly supplierService = inject(SupplierService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmService = inject(ConfirmService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly rawMaterials = signal<RawMaterial[]>([]);
  readonly supplierOptions = signal<RawMaterialSupplierOption[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadingSuppliers = signal(false);

  readonly totalRecords = signal(0);
  readonly currentPage = signal(1);
  readonly rows = signal(10);

  readonly search = signal('');
  readonly materialTypeFilter = signal('');

  readonly dialogVisible = signal(false);
  readonly editingRawMaterial = signal<RawMaterial | null>(null);

  readonly form = this.fb.group({
    supplier_id: [null as number | null],
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(1000)]],
    material_type: ['', [Validators.required, Validators.maxLength(50)]],
    unit_measure: ['', [Validators.required, Validators.maxLength(30)]],
    cost_per_unit: [0, [Validators.required, Validators.min(0)]],
    minimum_stock: [null as number | null],
    expiration_date: [''],
    status: true
  });

  readonly codeControl = this.form.controls.code;
  readonly nameControl = this.form.controls.name;
  readonly materialTypeControl = this.form.controls.material_type;
  readonly unitMeasureControl = this.form.controls.unit_measure;

  constructor() {
    this.loadRawMaterials();
    this.loadSupplierOptions();
  }

  get isEditMode(): boolean {
    return !!this.editingRawMaterial();
  }

  get isSubmitDisabled(): boolean {
    return this.form.invalid || this.saving();
  }

  loadRawMaterials(page = this.currentPage()): void {
    this.loading.set(true);

    const params: RawMaterialQueryParams = {
      search: this.search(),
      material_type: this.materialTypeFilter(),
      page,
      per_page: this.rows()
    };

    this.rawMaterialService
      .getRawMaterials(params)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: ApiResponse<RawMaterialListData>) => {
          this.rawMaterials.set(response.data.items);
          this.totalRecords.set(response.data.pagination.total);
          this.currentPage.set(response.data.pagination.current_page);
          this.rows.set(response.data.pagination.per_page);
        },
        error: (error: unknown) => {
          const message =
            this.getErrorMessage(error) ??
            'No fue posible cargar las materias primas.';

          this.notificationService.error('Error al cargar', message);
        }
      });
  }

  loadSupplierOptions(): void {
    this.loadingSuppliers.set(true);

    this.supplierService
      ['getActiveSuppliers']()
      .pipe(finalize(() => this.loadingSuppliers.set(false)))
      .subscribe({
        next: (
          response: ApiResponse<Array<{ id: number; business_name: string }>>
        ) => {
          this.supplierOptions.set(response.data);
        },
        error: (_error: unknown) => {
          this.notificationService.warn(
            'Proveedores',
            'No fue posible cargar la lista de proveedores activos.'
          );
        }
      });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
  }

  onMaterialTypeFilterChange(value: string): void {
    this.materialTypeFilter.set(value);
  }

  applyFilters(): void {
    this.loadRawMaterials(1);
  }

  resetFilters(): void {
    this.search.set('');
    this.materialTypeFilter.set('');
    this.loadRawMaterials(1);
  }

  onPageChange(event: { first: number; rows: number }): void {
    const nextPage = Math.floor(event.first / event.rows) + 1;
    this.rows.set(event.rows);
    this.loadRawMaterials(nextPage);
  }

  openCreateDialog(): void {
    this.editingRawMaterial.set(null);
    this.form.reset({
      supplier_id: null,
      code: '',
      name: '',
      description: '',
      material_type: '',
      unit_measure: '',
      cost_per_unit: 0,
      minimum_stock: null,
      expiration_date: '',
      status: true
    });
    this.dialogVisible.set(true);
  }

  openEditDialog(rawMaterial: RawMaterial): void {
    this.editingRawMaterial.set(rawMaterial);
    this.form.reset({
      supplier_id: rawMaterial.supplier_id,
      code: rawMaterial.code,
      name: rawMaterial.name,
      description: rawMaterial.description ?? '',
      material_type: rawMaterial.material_type,
      unit_measure: rawMaterial.unit_measure,
      cost_per_unit: Number(rawMaterial.cost_per_unit),
      minimum_stock:
        rawMaterial.minimum_stock !== null &&
        rawMaterial.minimum_stock !== undefined
          ? Number(rawMaterial.minimum_stock)
          : null,
      expiration_date: rawMaterial.expiration_date ?? '',
      status: rawMaterial.status
    });
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.editingRawMaterial.set(null);
    this.form.reset({
      supplier_id: null,
      code: '',
      name: '',
      description: '',
      material_type: '',
      unit_measure: '',
      cost_per_unit: 0,
      minimum_stock: null,
      expiration_date: '',
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

    const payload: RawMaterialPayload = {
      supplier_id: raw.supplier_id,
      code: raw.code.trim(),
      name: raw.name.trim(),
      description: raw.description?.trim() ? raw.description.trim() : null,
      material_type: raw.material_type.trim(),
      unit_measure: raw.unit_measure.trim(),
      cost_per_unit: Number(raw.cost_per_unit),
      minimum_stock:
        raw.minimum_stock === null || raw.minimum_stock === undefined
          ? null
          : Number(raw.minimum_stock),
      expiration_date: raw.expiration_date?.trim()
        ? raw.expiration_date
        : null,
      status: raw.status
    };

    const request$ = this.isEditMode
      ? this.rawMaterialService.updateRawMaterial(
          this.editingRawMaterial()!.id,
          payload
        )
      : this.rawMaterialService.createRawMaterial(payload);

    request$
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (response: ApiResponse<RawMaterial>) => {
          this.notificationService.success(
            this.isEditMode
              ? 'Materia prima actualizada'
              : 'Materia prima creada',
            response.message
          );
          this.closeDialog();
          this.loadRawMaterials(this.currentPage());
        },
        error: (error: unknown) => {
          const message =
            this.getErrorMessage(error) ??
            'No fue posible guardar la materia prima.';

          this.notificationService.error('Error al guardar', message);
        }
      });
  }

  deleteRawMaterial(rawMaterial: RawMaterial): void {
    this.confirmService.confirmDelete({
      message: `¿Deseas eliminar la materia prima "${rawMaterial.name}"? Esta acción no se puede deshacer.`,
      accept: () => {
        this.loading.set(true);

        this.rawMaterialService
          .deleteRawMaterial(rawMaterial.id)
          .pipe(finalize(() => this.loading.set(false)))
          .subscribe({
            next: (response: ApiResponse<null>) => {
              this.notificationService.success(
                'Materia prima eliminada',
                response.message
              );
              this.loadRawMaterials(this.currentPage());
            },
            error: (error: unknown) => {
              const message =
                this.getErrorMessage(error) ??
                'No fue posible eliminar la materia prima.';

              this.notificationService.error('Error al eliminar', message);
            }
          });
      }
    });
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
