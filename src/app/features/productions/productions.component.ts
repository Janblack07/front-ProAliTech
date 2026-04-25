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
  Production,
  ProductionDetailPayload,
  ProductionListData,
  ProductionPayload
} from '../../core/models/production.model';
import { ProductionQueryParams, ProductionService } from './data/production.service';
import { ProductService } from '../products/data/product.service';
import { RecipeService } from '../recipes/data/recipe.service';
import { RawMaterialService } from '../raw-materials/data/raw-material.service';
import { NotificationService } from '../../core/services/notification.service';

type ProductionDetailForm = FormGroup<{
  raw_material_id: FormControl<number | null>;
  quantity_used: FormControl<number>;
  unit_measure: FormControl<string>;
  batch_number: FormControl<string>;
  expiration_date: FormControl<string>;
}>;

@Component({
  selector: 'app-productions',
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
  templateUrl: './productions.component.html',
  styleUrl: './productions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductionsComponent {
  private readonly productionService = inject(ProductionService);
  private readonly productService = inject(ProductService);
  private readonly recipeService = inject(RecipeService);
  private readonly rawMaterialService = inject(RawMaterialService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly productions = signal<Production[]>([]);
  readonly productOptions = signal<Array<{ id: number; name: string; code: string }>>([]);
  readonly recipeOptions = signal<Array<{ id: number; recipe_name: string; product_id: number }>>([]);
  readonly rawMaterialOptions = signal<Array<{ id: number; name: string; code: string; unit_measure: string }>>([]);

  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly totalRecords = signal(0);
  readonly currentPage = signal(1);
  readonly rows = signal(10);

  readonly search = signal('');
  readonly statusFilter = signal<'all' | 'in_progress' | 'completed' | 'cancelled'>('all');

  readonly dialogVisible = signal(false);
  readonly viewDialogVisible = signal(false);
  readonly selectedProduction = signal<Production | null>(null);

  readonly form = this.fb.group({
    product_id: [null as number | null, [Validators.required]],
    recipe_id: [null as number | null],
    batch_number: ['', [Validators.required, Validators.maxLength(100)]],
    production_date: ['', [Validators.required]],
    expected_quantity: [0, [Validators.required, Validators.min(0.01)]],
    produced_quantity: [0, [Validators.required, Validators.min(0.01)]],
    unit_measure: ['', [Validators.required, Validators.maxLength(30)]],
    labor_cost: [null as number | null],
    energy_cost: [null as number | null],
    indirect_cost: [null as number | null],
    waste_quantity: [null as number | null],
    notes: [''],
    details: this.fb.array<ProductionDetailForm>([])
  });

  constructor() {
    this.loadProductions();
    this.loadOptions();
  }

  get details(): FormArray<ProductionDetailForm> {
    return this.form.controls.details;
  }

  get isSubmitDisabled(): boolean {
    return this.form.invalid || this.saving() || this.details.length === 0;
  }

  private createDetailGroup(detail?: {
    raw_material_id?: number | null;
    quantity_used?: number;
    unit_measure?: string;
    batch_number?: string;
    expiration_date?: string;
  }): ProductionDetailForm {
    return this.fb.group({
      raw_material_id: [detail?.raw_material_id ?? null, [Validators.required]],
      quantity_used: [detail?.quantity_used ?? 0, [Validators.required, Validators.min(0.01)]],
      unit_measure: [detail?.unit_measure ?? '', [Validators.required, Validators.maxLength(30)]],
      batch_number: [detail?.batch_number ?? ''],
      expiration_date: [detail?.expiration_date ?? '']
    });
  }

  addDetail(detail?: {
    raw_material_id?: number | null;
    quantity_used?: number;
    unit_measure?: string;
    batch_number?: string;
    expiration_date?: string;
  }): void {
    this.details.push(this.createDetailGroup(detail));
  }

  removeDetail(index: number): void {
    this.details.removeAt(index);
  }

  onRawMaterialChange(index: number, rawMaterialId: number | null): void {
    const selected = this.rawMaterialOptions().find(item => item.id === Number(rawMaterialId));
    if (!selected) return;

    this.details.at(index).patchValue({
      unit_measure: selected.unit_measure
    });
  }

  onProductChange(productId: number | null): void {
    if (!productId) {
      this.form.patchValue({ recipe_id: null });
      return;
    }

    const recipe = this.recipeOptions().find(item => item.product_id === Number(productId));
    if (recipe) {
      this.form.patchValue({ recipe_id: recipe.id });
    }
  }

  loadProductions(page = this.currentPage()): void {
    this.loading.set(true);

    const params: ProductionQueryParams = {
      search: this.search(),
      status: this.statusFilter(),
      page,
      per_page: this.rows()
    };

    this.productionService
      .getProductions(params)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: ApiResponse<ProductionListData>) => {
          this.productions.set(response.data.items);
          this.totalRecords.set(response.data.pagination.total);
          this.currentPage.set(response.data.pagination.current_page);
          this.rows.set(response.data.pagination.per_page);
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al cargar',
            this.getErrorMessage(error) ?? 'No fue posible cargar las producciones.'
          );
        }
      });
  }

  loadOptions(): void {
    this.productService.getActiveProducts().subscribe({
      next: (response: ApiResponse<Array<{ id: number; name: string; code: string }>>) => {
        this.productOptions.set(response.data);
      }
    });

    this.recipeService.getActiveRecipes().subscribe({
      next: (response: ApiResponse<Array<{ id: number; recipe_name: string; product_id: number }>>) => {
        this.recipeOptions.set(response.data);
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

  onStatusFilterChange(value: 'all' | 'in_progress' | 'completed' | 'cancelled'): void {
    this.statusFilter.set(value);
  }

  applyFilters(): void {
    this.loadProductions(1);
  }

  resetFilters(): void {
    this.search.set('');
    this.statusFilter.set('all');
    this.loadProductions(1);
  }

  onPageChange(event: { first: number; rows: number }): void {
    const nextPage = Math.floor(event.first / event.rows) + 1;
    this.rows.set(event.rows);
    this.loadProductions(nextPage);
  }

  openCreateDialog(): void {
    this.form.reset({
      product_id: null,
      recipe_id: null,
      batch_number: '',
      production_date: '',
      expected_quantity: 0,
      produced_quantity: 0,
      unit_measure: '',
      labor_cost: null,
      energy_cost: null,
      indirect_cost: null,
      waste_quantity: null,
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

  openViewDialog(production: Production): void {
    this.selectedProduction.set(null);
    this.viewDialogVisible.set(true);

    this.productionService.getProduction(production.id).subscribe({
      next: (response: ApiResponse<Production>) => {
        this.selectedProduction.set(response.data);
      },
      error: (error: unknown) => {
        this.notificationService.error(
          'Error al cargar detalle',
          this.getErrorMessage(error) ?? 'No fue posible cargar el detalle de producción.'
        );
        this.viewDialogVisible.set(false);
      }
    });
  }

  closeViewDialog(): void {
    this.viewDialogVisible.set(false);
    this.selectedProduction.set(null);
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

    const details: ProductionDetailPayload[] = raw.details.map(detail => ({
      raw_material_id: Number(detail.raw_material_id),
      quantity_used: Number(detail.quantity_used),
      unit_measure: detail.unit_measure.trim(),
      batch_number: detail.batch_number?.trim() ? detail.batch_number.trim() : null,
      expiration_date: detail.expiration_date?.trim() ? detail.expiration_date : null
    }));

    const payload: ProductionPayload = {
      product_id: Number(raw.product_id),
      recipe_id: raw.recipe_id ? Number(raw.recipe_id) : null,
      batch_number: raw.batch_number.trim(),
      production_date: raw.production_date,
      expected_quantity: Number(raw.expected_quantity),
      produced_quantity: Number(raw.produced_quantity),
      unit_measure: raw.unit_measure.trim(),
      labor_cost: raw.labor_cost === null ? null : Number(raw.labor_cost),
      energy_cost: raw.energy_cost === null ? null : Number(raw.energy_cost),
      indirect_cost: raw.indirect_cost === null ? null : Number(raw.indirect_cost),
      waste_quantity: raw.waste_quantity === null ? null : Number(raw.waste_quantity),
      notes: raw.notes?.trim() ? raw.notes.trim() : null,
      details
    };

    this.productionService
      .createProduction(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (response: ApiResponse<Production>) => {
          this.notificationService.success(
            'Producción registrada',
            response.message
          );
          this.closeDialog();
          this.loadProductions(this.currentPage());
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al guardar',
            this.getErrorMessage(error) ?? 'No fue posible registrar la producción.'
          );
        }
      });
  }

  getStatusLabel(status: Production['status']): string {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'in_progress':
        return 'En proceso';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  }

  getStatusSeverity(status: Production['status']): 'success' | 'warn' | 'danger' {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warn';
      case 'cancelled':
        return 'danger';
      default:
        return 'warn';
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
