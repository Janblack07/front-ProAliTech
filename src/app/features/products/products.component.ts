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
  Product,
  ProductCategoryOption,
  ProductListData,
  ProductPayload
} from '../../core/models/product.model';
import {
  ProductQueryParams,
  ProductService
} from './data/product.service';
import { CategoryService } from '../categories/data/category.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { CardModule } from 'primeng/card';
@Component({
  selector: 'app-products',
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
    TextareaModule,
    CardModule
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsComponent {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmService = inject(ConfirmService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly products = signal<Product[]>([]);
  readonly categoryOptions = signal<ProductCategoryOption[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadingCategories = signal(false);

  readonly totalRecords = signal(0);
  readonly currentPage = signal(1);
  readonly rows = signal(10);

  readonly search = signal('');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  readonly categoryIdFilter = signal<number | null>(null);

  readonly dialogVisible = signal(false);
  readonly editingProduct = signal<Product | null>(null);

  readonly selectedImage = signal<File | null>(null);
  readonly imagePreview = signal<string | null>(null);

  readonly form = this.fb.group({
    category_id: [null as number | null, [Validators.required]],
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(1000)]],
    unit_measure: ['', [Validators.required, Validators.maxLength(30)]],
    cost_price: [0, [Validators.required, Validators.min(0)]],
    sale_price: [0, [Validators.required, Validators.min(0)]],
    minimum_stock: [null as number | null],
    shelf_life_days: [null as number | null],
    status: true
  });

  readonly categoryIdControl = this.form.controls.category_id;
  readonly codeControl = this.form.controls.code;
  readonly nameControl = this.form.controls.name;
  readonly unitMeasureControl = this.form.controls.unit_measure;
  readonly costPriceControl = this.form.controls.cost_price;
  readonly salePriceControl = this.form.controls.sale_price;

  constructor() {
    this.loadProducts();
    this.loadCategoryOptions();
  }

  get isEditMode(): boolean {
    return !!this.editingProduct();
  }

  get isSubmitDisabled(): boolean {
    return this.form.invalid || this.saving();
  }

  loadProducts(page = this.currentPage()): void {
    this.loading.set(true);

    const params: ProductQueryParams = {
      search: this.search(),
      status: this.statusFilter(),
      category_id: this.categoryIdFilter(),
      page,
      per_page: this.rows()
    };

    this.productService
      .getProducts(params)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: ApiResponse<ProductListData>) => {
          this.products.set(response.data.items);
          this.totalRecords.set(response.data.pagination.total);
          this.currentPage.set(response.data.pagination.current_page);
          this.rows.set(response.data.pagination.per_page);
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al cargar',
            this.getErrorMessage(error) ?? 'No fue posible cargar los productos.'
          );
        }
      });
  }

  loadCategoryOptions(): void {
    this.loadingCategories.set(true);

    this.categoryService
      .getActiveCategories()
      .pipe(finalize(() => this.loadingCategories.set(false)))
      .subscribe({
        next: (response: ApiResponse<Array<{ id: number; name: string }>>) => {
          this.categoryOptions.set(response.data);
        },
        error: () => {
          this.notificationService.warn(
            'Categorías',
            'No fue posible cargar la lista de categorías activas.'
          );
        }
      });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
  }

  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.statusFilter.set(value);
  }

  onCategoryFilterChange(value: number | null): void {
    this.categoryIdFilter.set(value);
  }

  applyFilters(): void {
    this.loadProducts(1);
  }

  resetFilters(): void {
    this.search.set('');
    this.statusFilter.set('all');
    this.categoryIdFilter.set(null);
    this.loadProducts(1);
  }

  onPageChange(event: { first: number; rows: number }): void {
    const nextPage = Math.floor(event.first / event.rows) + 1;
    this.rows.set(event.rows);
    this.loadProducts(nextPage);
  }

  openCreateDialog(): void {
    this.editingProduct.set(null);
    this.selectedImage.set(null);
    this.imagePreview.set(null);

    this.form.reset({
      category_id: null,
      code: '',
      name: '',
      description: '',
      unit_measure: '',
      cost_price: 0,
      sale_price: 0,
      minimum_stock: null,
      shelf_life_days: null,
      status: true
    });

    this.dialogVisible.set(true);
  }

  openEditDialog(product: Product): void {
    this.editingProduct.set(product);
    this.selectedImage.set(null);
    this.imagePreview.set(product.image_url);

    this.form.reset({
      category_id: product.category_id,
      code: product.code,
      name: product.name,
      description: product.description ?? '',
      unit_measure: product.unit_measure,
      cost_price: Number(product.cost_price),
      sale_price: Number(product.sale_price),
      minimum_stock:
        product.minimum_stock !== null && product.minimum_stock !== undefined
          ? Number(product.minimum_stock)
          : null,
      shelf_life_days: product.shelf_life_days,
      status: product.status
    });

    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.editingProduct.set(null);
    this.selectedImage.set(null);
    this.imagePreview.set(null);

    this.form.reset({
      category_id: null,
      code: '',
      name: '',
      description: '',
      unit_measure: '',
      cost_price: 0,
      sale_price: 0,
      minimum_stock: null,
      shelf_life_days: null,
      status: true
    });
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.selectedImage.set(file);

    if (!file) {
      this.imagePreview.set(this.editingProduct()?.image_url ?? null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(String(reader.result));
    reader.readAsDataURL(file);
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

    const payload: ProductPayload = {
      category_id: Number(raw.category_id),
      code: raw.code.trim(),
      name: raw.name.trim(),
      description: raw.description?.trim() ? raw.description.trim() : null,
      unit_measure: raw.unit_measure.trim(),
      cost_price: Number(raw.cost_price),
      sale_price: Number(raw.sale_price),
      minimum_stock:
        raw.minimum_stock === null || raw.minimum_stock === undefined
          ? null
          : Number(raw.minimum_stock),
      shelf_life_days:
        raw.shelf_life_days === null || raw.shelf_life_days === undefined
          ? null
          : Number(raw.shelf_life_days),
      status: raw.status,
      image: this.selectedImage()
    };

    const request$ = this.isEditMode
      ? this.productService.updateProduct(this.editingProduct()!.id, payload)
      : this.productService.createProduct(payload);

    request$
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (response: ApiResponse<Product>) => {
          this.notificationService.success(
            this.isEditMode ? 'Producto actualizado' : 'Producto creado',
            response.message
          );
          this.closeDialog();
          this.loadProducts(this.currentPage());
        },
        error: (error: unknown) => {
          this.notificationService.error(
            'Error al guardar',
            this.getErrorMessage(error) ?? 'No fue posible guardar el producto.'
          );
        }
      });
  }

  deleteProduct(product: Product): void {
    this.confirmService.confirmDelete({
      message: `¿Deseas eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`,
      accept: () => {
        this.loading.set(true);

        this.productService
          .deleteProduct(product.id)
          .pipe(finalize(() => this.loading.set(false)))
          .subscribe({
            next: (response: ApiResponse<null>) => {
              this.notificationService.success(
                'Producto eliminado',
                response.message
              );
              this.loadProducts(this.currentPage());
            },
            error: (error: unknown) => {
              this.notificationService.error(
                'Error al eliminar',
                this.getErrorMessage(error) ?? 'No fue posible eliminar el producto.'
              );
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
