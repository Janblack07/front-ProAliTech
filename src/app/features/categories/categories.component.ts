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
import { ConfirmService } from '../../core/services/confirm.service';

import {
  Category,
  CategoryPayload
} from '../../core/models/category.model';
import {
  CategoryQueryParams,
  CategoryService
} from './data/category.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
    TagModule,
    TextareaModule,

  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoriesComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly confirmService = inject(ConfirmService);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly totalRecords = signal(0);
  readonly currentPage = signal(1);
  readonly rows = signal(10);

  readonly search = signal('');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');

  readonly dialogVisible = signal(false);
  readonly editingCategory = signal<Category | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    status: true
  });

  readonly nameControl = this.form.controls.name;
  readonly descriptionControl = this.form.controls.description;
  readonly statusControl = this.form.controls.status;

  constructor() {
    this.loadCategories();
  }

  get isEditMode(): boolean {
    return !!this.editingCategory();
  }

  get isSubmitDisabled(): boolean {
    return this.form.invalid || this.saving();
  }

  loadCategories(page = this.currentPage()): void {
    this.loading.set(true);

    const params: CategoryQueryParams = {
      search: this.search(),
      status: this.statusFilter(),
      page,
      per_page: this.rows()
    };

    this.categoryService
      .getCategories(params)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.categories.set(response.data.items);
          this.totalRecords.set(response.data.pagination.total);
          this.currentPage.set(response.data.pagination.current_page);
          this.rows.set(response.data.pagination.per_page);
        },
        error: (error) => {
          this.notificationService.error(
            'Error al cargar',
            error?.error?.message ?? 'No fue posible cargar las categorías.'
          );
        }
      });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
  }

  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.statusFilter.set(value);
    this.loadCategories(1);
  }

  applyFilters(): void {
    this.loadCategories(1);
  }

  resetFilters(): void {
    this.search.set('');
    this.statusFilter.set('all');
    this.loadCategories(1);
  }

  onPageChange(event: { first: number; rows: number }): void {
    const nextPage = Math.floor(event.first / event.rows) + 1;
    this.rows.set(event.rows);
    this.loadCategories(nextPage);
  }

  openCreateDialog(): void {
    this.editingCategory.set(null);
    this.form.reset({
      name: '',
      description: '',
      status: true
    });
    this.dialogVisible.set(true);
  }

  openEditDialog(category: Category): void {
    this.editingCategory.set(category);
    this.form.reset({
      name: category.name,
      description: category.description ?? '',
      status: category.status
    });
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.editingCategory.set(null);
    this.form.reset({
      name: '',
      description: '',
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

    const payload: CategoryPayload = {
      name: raw.name.trim(),
      description: raw.description?.trim() ? raw.description.trim() : null,
      status: raw.status
    };

    const request$ = this.isEditMode
      ? this.categoryService.updateCategory(this.editingCategory()!.id, payload)
      : this.categoryService.createCategory(payload);

    request$
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (response) => {
          this.notificationService.success(
            this.isEditMode ? 'Categoría actualizada' : 'Categoría creada',
            response.message
          );
          this.closeDialog();
          this.loadCategories(this.currentPage());
        },
        error: (error) => {
          this.notificationService.error(
            'Error al guardar',
            error?.error?.message ?? 'No fue posible guardar la categoría.'
          );
        }
      });
  }

 deleteCategory(category: Category): void {
  this.confirmService.confirmDelete({
    message: `¿Deseas eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`,
    accept: () => {
      this.loading.set(true);

      this.categoryService
        .deleteCategory(category.id)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (response) => {
            this.notificationService.success(
              'Categoría eliminada',
              response.message
            );
            this.loadCategories(this.currentPage());
          },
          error: (error) => {
            this.notificationService.error(
              'Error al eliminar',
              error?.error?.message ?? 'No fue posible eliminar la categoría.'
            );
          }
        });
    }
  });
}
}
