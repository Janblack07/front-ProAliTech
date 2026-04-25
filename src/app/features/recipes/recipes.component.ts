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
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';

import { ApiResponse } from '../../core/models/api-response.model';
import {
  Recipe,
  RecipeDetailPayload,
  RecipeListData,
  RecipePayload
} from '../../core/models/recipe.model';
import { ProductService } from '../products/data/product.service';
import { RawMaterialService } from '../raw-materials/data/raw-material.service';
import { RecipeQueryParams, RecipeService } from './data/recipe.service';
import { NotificationService } from '../../core/services/notification.service';

type RecipeDetailForm = FormGroup<{
  raw_material_id: FormControl<number | null>;
  quantity: FormControl<number>;
  unit_measure: FormControl<string>;
}>;

@Component({
  selector: 'app-recipes',
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
  templateUrl: './recipes.component.html',
  styleUrl: './recipes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipesComponent {
  private readonly recipeService = inject(RecipeService);
  private readonly productService = inject(ProductService);
  private readonly rawMaterialService = inject(RawMaterialService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly recipes = signal<Recipe[]>([]);
  readonly productOptions = signal<Array<{ id: number; name: string; code: string }>>([]);
  readonly rawMaterialOptions = signal<Array<{ id: number; name: string; code: string; unit_measure: string }>>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly totalRecords = signal(0);
  readonly currentPage = signal(1);
  readonly rows = signal(10);

  readonly search = signal('');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');

  readonly dialogVisible = signal(false);
  readonly editingRecipe = signal<Recipe | null>(null);

  readonly form = this.fb.group({
    product_id: [null as number | null, [Validators.required]],
    recipe_name: ['', [Validators.required, Validators.maxLength(150)]],
    expected_yield: [0, [Validators.required, Validators.min(0.01)]],
    unit_measure: ['', [Validators.required, Validators.maxLength(30)]],
    estimated_labor_cost: [null as number | null],
    estimated_energy_cost: [null as number | null],
    estimated_indirect_cost: [null as number | null],
    estimated_waste_percent: [null as number | null],
    instructions: [''],
    status: true,
    details: this.fb.array<RecipeDetailForm>([])
  });

  readonly productIdControl = this.form.controls.product_id;
  readonly recipeNameControl = this.form.controls.recipe_name;
  readonly expectedYieldControl = this.form.controls.expected_yield;
  readonly unitMeasureControl = this.form.controls.unit_measure;

  constructor() {
    this.loadRecipes();
    this.loadOptions();
  }

  get details(): FormArray<RecipeDetailForm> {
    return this.form.controls.details;
  }

  get isEditMode(): boolean {
    return !!this.editingRecipe();
  }

  get isSubmitDisabled(): boolean {
    return this.form.invalid || this.saving() || this.details.length === 0;
  }

  private createDetailGroup(detail?: {
    raw_material_id?: number | null;
    quantity?: number;
    unit_measure?: string;
  }): RecipeDetailForm {
    return this.fb.group({
      raw_material_id: [detail?.raw_material_id ?? null, [Validators.required]],
      quantity: [detail?.quantity ?? 0, [Validators.required, Validators.min(0.01)]],
      unit_measure: [detail?.unit_measure ?? '', [Validators.required, Validators.maxLength(30)]]
    });
  }

  addDetail(detail?: {
    raw_material_id?: number | null;
    quantity?: number;
    unit_measure?: string;
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

  loadRecipes(page = this.currentPage()): void {
    this.loading.set(true);

    const params: RecipeQueryParams = {
      search: this.search(),
      status: this.statusFilter(),
      page,
      per_page: this.rows()
    };

    this.recipeService
      .getRecipes(params)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: ApiResponse<RecipeListData>) => {
          this.recipes.set(response.data.items);
          this.totalRecords.set(response.data.pagination.total);
          this.currentPage.set(response.data.pagination.current_page);
          this.rows.set(response.data.pagination.per_page);
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al cargar',
            this.getErrorMessage(error) ?? 'No fue posible cargar las recetas.'
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

    this.rawMaterialService.getActiveRawMaterials().subscribe({
      next: (response: ApiResponse<Array<{ id: number; name: string; code: string; unit_measure: string }>>) => {
        this.rawMaterialOptions.set(response.data);
      }
    });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
  }

  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.statusFilter.set(value);
  }

  applyFilters(): void {
    this.loadRecipes(1);
  }

  resetFilters(): void {
    this.search.set('');
    this.statusFilter.set('all');
    this.loadRecipes(1);
  }

  onPageChange(event: { first: number; rows: number }): void {
    const nextPage = Math.floor(event.first / event.rows) + 1;
    this.rows.set(event.rows);
    this.loadRecipes(nextPage);
  }

  openCreateDialog(): void {
    this.editingRecipe.set(null);
    this.form.reset({
      product_id: null,
      recipe_name: '',
      expected_yield: 0,
      unit_measure: '',
      estimated_labor_cost: null,
      estimated_energy_cost: null,
      estimated_indirect_cost: null,
      estimated_waste_percent: null,
      instructions: '',
      status: true
    });

    this.details.clear();
    this.addDetail();
    this.dialogVisible.set(true);
  }

  openEditDialog(recipe: Recipe): void {
    this.editingRecipe.set(recipe);
    this.form.reset({
      product_id: recipe.product_id,
      recipe_name: recipe.recipe_name,
      expected_yield: Number(recipe.expected_yield),
      unit_measure: recipe.unit_measure,
      estimated_labor_cost: recipe.estimated_labor_cost ? Number(recipe.estimated_labor_cost) : null,
      estimated_energy_cost: recipe.estimated_energy_cost ? Number(recipe.estimated_energy_cost) : null,
      estimated_indirect_cost: recipe.estimated_indirect_cost ? Number(recipe.estimated_indirect_cost) : null,
      estimated_waste_percent: recipe.estimated_waste_percent ? Number(recipe.estimated_waste_percent) : null,
      instructions: recipe.instructions ?? '',
      status: recipe.status
    });

    this.details.clear();
    for (const detail of recipe.details) {
      this.addDetail({
        raw_material_id: detail.raw_material_id,
        quantity: Number(detail.quantity),
        unit_measure: detail.unit_measure
      });
    }

    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.editingRecipe.set(null);
    this.details.clear();
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

    const details: RecipeDetailPayload[] = raw.details.map(detail => ({
      raw_material_id: Number(detail.raw_material_id),
      quantity: Number(detail.quantity),
      unit_measure: detail.unit_measure.trim()
    }));

    const payload: RecipePayload = {
      product_id: Number(raw.product_id),
      recipe_name: raw.recipe_name.trim(),
      expected_yield: Number(raw.expected_yield),
      unit_measure: raw.unit_measure.trim(),
      estimated_labor_cost: raw.estimated_labor_cost === null ? null : Number(raw.estimated_labor_cost),
      estimated_energy_cost: raw.estimated_energy_cost === null ? null : Number(raw.estimated_energy_cost),
      estimated_indirect_cost: raw.estimated_indirect_cost === null ? null : Number(raw.estimated_indirect_cost),
      estimated_waste_percent: raw.estimated_waste_percent === null ? null : Number(raw.estimated_waste_percent),
      instructions: raw.instructions?.trim() ? raw.instructions.trim() : null,
      status: raw.status,
      details
    };

    const request$ = this.isEditMode
      ? this.recipeService.updateRecipe(this.editingRecipe()!.id, payload)
      : this.recipeService.createRecipe(payload);

    request$
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (response: ApiResponse<Recipe>) => {
          this.notificationService.success(
            this.isEditMode ? 'Receta actualizada' : 'Receta creada',
            response.message
          );
          this.closeDialog();
          this.loadRecipes(this.currentPage());
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al guardar',
            this.getErrorMessage(error) ?? 'No fue posible guardar la receta.'
          );
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
