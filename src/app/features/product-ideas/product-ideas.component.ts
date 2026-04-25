import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';

import { ApiResponse } from '../../core/models/api-response.model';
import {
  ProductEvaluation,
  ProductEvaluationPayload,
  ProductIdea,
  ProductIdeaListData,
  ProductIdeaPayload
} from '../../core/models/product-idea.model';
import {
  ProductIdeaQueryParams,
  ProductIdeaService
} from './data/product-idea.service';
import { CategoryService } from '../categories/data/category.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-product-ideas',
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
  templateUrl: './product-ideas.component.html',
  styleUrl: './product-ideas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductIdeasComponent {
  private readonly productIdeaService = inject(ProductIdeaService);
  private readonly categoryService = inject(CategoryService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly items = signal<ProductIdea[]>([]);
  readonly categoryOptions = signal<Array<{ id: number; name: string }>>([]);
  readonly evaluations = signal<ProductEvaluation[]>([]);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly savingEvaluation = signal(false);
  readonly loadingEvaluations = signal(false);

  readonly totalRecords = signal(0);
  readonly currentPage = signal(1);
  readonly rows = signal(10);

  readonly search = signal('');
  readonly statusFilter = signal('');

  readonly dialogVisible = signal(false);
  readonly evaluationDialogVisible = signal(false);
  readonly viewDialogVisible = signal(false);

  readonly selectedIdea = signal<ProductIdea | null>(null);

  readonly form = this.fb.group({
    category_id: [null as number | null, [Validators.required]],
    idea_name: ['', [Validators.required, Validators.maxLength(150)]],
    description: [''],
    proposed_sale_price: [null as number | null],
    expected_demand: ['', [Validators.maxLength(30)]],
    competition_level: ['', [Validators.maxLength(30)]],
    estimated_labor_cost: [null as number | null],
    estimated_energy_cost: [null as number | null],
    estimated_indirect_cost: [null as number | null],
    estimated_waste_percent: [null as number | null],
    observations: [''],
    status: ['draft']
  });

  readonly evaluationForm = this.fb.group({
    estimated_total_cost: [0, [Validators.required, Validators.min(0.01)]],
    estimated_unit_cost: [0, [Validators.required, Validators.min(0.01)]],
    proposed_sale_price: [0, [Validators.required, Validators.min(0.01)]],
    fixed_costs: [null as number | null],
    recommendation_notes: ['']
  });

  readonly estimatedProfit = computed(() => {
    const salePrice = Number(this.evaluationForm.controls.proposed_sale_price.value || 0);
    const unitCost = Number(this.evaluationForm.controls.estimated_unit_cost.value || 0);
    return salePrice - unitCost;
  });

  readonly estimatedMargin = computed(() => {
    const salePrice = Number(this.evaluationForm.controls.proposed_sale_price.value || 0);
    const profit = this.estimatedProfit();
    if (salePrice <= 0) return 0;
    return (profit / salePrice) * 100;
  });

  constructor() {
    this.loadIdeas();
    this.loadCategories();
  }

  get isEditMode(): boolean {
    return !!this.selectedIdea() && this.dialogVisible();
  }

  loadIdeas(page = this.currentPage()): void {
    this.loading.set(true);

    const params: ProductIdeaQueryParams = {
      search: this.search(),
      status: this.statusFilter() || null,
      page,
      per_page: this.rows()
    };

    this.productIdeaService
      .getProductIdeas(params)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: ApiResponse<ProductIdeaListData>) => {
          this.items.set(response.data.items);
          this.totalRecords.set(response.data.pagination.total);
          this.currentPage.set(response.data.pagination.current_page);
          this.rows.set(response.data.pagination.per_page);
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al cargar',
            this.getErrorMessage(error) ?? 'No fue posible cargar las ideas de producto.'
          );
        }
      });
  }

  loadCategories(): void {
    this.categoryService.getActiveCategories().subscribe({
      next: (response: ApiResponse<Array<{ id: number; name: string }>>) => {
        this.categoryOptions.set(response.data);
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
    this.loadIdeas(1);
  }

  resetFilters(): void {
    this.search.set('');
    this.statusFilter.set('');
    this.loadIdeas(1);
  }

  onPageChange(event: { first: number; rows: number }): void {
    const nextPage = Math.floor(event.first / event.rows) + 1;
    this.rows.set(event.rows);
    this.loadIdeas(nextPage);
  }

  openCreateDialog(): void {
    this.selectedIdea.set(null);
    this.form.reset({
      category_id: null,
      idea_name: '',
      description: '',
      proposed_sale_price: null,
      expected_demand: '',
      competition_level: '',
      estimated_labor_cost: null,
      estimated_energy_cost: null,
      estimated_indirect_cost: null,
      estimated_waste_percent: null,
      observations: '',
      status: 'draft'
    });
    this.dialogVisible.set(true);
  }

  openEditDialog(item: ProductIdea): void {
    this.selectedIdea.set(item);
    this.form.reset({
      category_id: item.category_id,
      idea_name: item.idea_name,
      description: item.description ?? '',
      proposed_sale_price: item.proposed_sale_price !== null ? Number(item.proposed_sale_price) : null,
      expected_demand: item.expected_demand ?? '',
      competition_level: item.competition_level ?? '',
      estimated_labor_cost: item.estimated_labor_cost !== null ? Number(item.estimated_labor_cost) : null,
      estimated_energy_cost: item.estimated_energy_cost !== null ? Number(item.estimated_energy_cost) : null,
      estimated_indirect_cost: item.estimated_indirect_cost !== null ? Number(item.estimated_indirect_cost) : null,
      estimated_waste_percent: item.estimated_waste_percent !== null ? Number(item.estimated_waste_percent) : null,
      observations: item.observations ?? '',
      status: item.status
    });
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.selectedIdea.set(null);
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

    const payload: ProductIdeaPayload = {
      category_id: Number(raw.category_id),
      idea_name: raw.idea_name.trim(),
      description: raw.description?.trim() ? raw.description.trim() : null,
      proposed_sale_price: raw.proposed_sale_price === null ? null : Number(raw.proposed_sale_price),
      expected_demand: raw.expected_demand?.trim() ? raw.expected_demand.trim() : null,
      competition_level: raw.competition_level?.trim() ? raw.competition_level.trim() : null,
      estimated_labor_cost: raw.estimated_labor_cost === null ? null : Number(raw.estimated_labor_cost),
      estimated_energy_cost: raw.estimated_energy_cost === null ? null : Number(raw.estimated_energy_cost),
      estimated_indirect_cost: raw.estimated_indirect_cost === null ? null : Number(raw.estimated_indirect_cost),
      estimated_waste_percent: raw.estimated_waste_percent === null ? null : Number(raw.estimated_waste_percent),
      observations: raw.observations?.trim() ? raw.observations.trim() : null,
      status: raw.status?.trim() ? raw.status.trim() : null
    };

    const request$ = this.selectedIdea()
      ? this.productIdeaService.updateProductIdea(this.selectedIdea()!.id, payload)
      : this.productIdeaService.createProductIdea(payload);

    request$
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (response: ApiResponse<ProductIdea>) => {
          this.notificationService.success(
            this.selectedIdea() ? 'Idea actualizada' : 'Idea creada',
            response.message
          );
          this.closeDialog();
          this.loadIdeas(this.currentPage());
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al guardar',
            this.getErrorMessage(error) ?? 'No fue posible guardar la idea.'
          );
        }
      });
  }

  openEvaluationDialog(item: ProductIdea): void {
    this.selectedIdea.set(item);
    this.evaluationForm.reset({
      estimated_total_cost: 0,
      estimated_unit_cost: 0,
      proposed_sale_price:
        item.proposed_sale_price !== null ? Number(item.proposed_sale_price) : 0,
      fixed_costs: null,
      recommendation_notes: ''
    });
    this.evaluationDialogVisible.set(true);
  }

  closeEvaluationDialog(): void {
    this.evaluationDialogVisible.set(false);
  }

  submitEvaluation(): void {
    const idea = this.selectedIdea();
    if (!idea || this.evaluationForm.invalid) {
      this.evaluationForm.markAllAsTouched();
      return;
    }

    this.savingEvaluation.set(true);
    const raw = this.evaluationForm.getRawValue();

    const payload: ProductEvaluationPayload = {
      estimated_total_cost: Number(raw.estimated_total_cost),
      estimated_unit_cost: Number(raw.estimated_unit_cost),
      proposed_sale_price: Number(raw.proposed_sale_price),
      fixed_costs: raw.fixed_costs === null ? null : Number(raw.fixed_costs),
      recommendation_notes: raw.recommendation_notes?.trim()
        ? raw.recommendation_notes.trim()
        : null
    };

    this.productIdeaService
      .createEvaluation(idea.id, payload)
      .pipe(finalize(() => this.savingEvaluation.set(false)))
      .subscribe({
        next: (response: ApiResponse<ProductEvaluation>) => {
          this.notificationService.success(
            'Evaluación creada',
            response.message
          );
          this.closeEvaluationDialog();
          this.loadIdeas(this.currentPage());
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al evaluar',
            this.getErrorMessage(error) ?? 'No fue posible crear la evaluación.'
          );
        }
      });
  }

  openViewDialog(item: ProductIdea): void {
    this.selectedIdea.set(item);
    this.evaluations.set([]);
    this.viewDialogVisible.set(true);
    this.loadingEvaluations.set(true);

    this.productIdeaService
      .getEvaluations(item.id)
      .pipe(finalize(() => this.loadingEvaluations.set(false)))
      .subscribe({
        next: (response: ApiResponse<ProductEvaluation[]>) => {
          this.evaluations.set(response.data);
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al cargar evaluaciones',
            this.getErrorMessage(error) ?? 'No fue posible cargar las evaluaciones.'
          );
        }
      });
  }

  closeViewDialog(): void {
    this.viewDialogVisible.set(false);
    this.evaluations.set([]);
    this.selectedIdea.set(null);
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (status) {
      case 'evaluated':
        return 'info';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'draft':
        return 'warn';
      default:
        return 'info';
    }
  }

  getViabilitySeverity(result: string): 'success' | 'info' | 'warn' | 'danger' {
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
