import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';

import { UserService } from '../users/data/user.service';
import { ProductService } from '../products/data/product.service';
import { RawMaterialService } from '../raw-materials/data/raw-material.service';
import { InventoryService } from '../inventory/data/inventory.service';
import { PurchaseService } from '../purchases/data/purchase.service';
import { SaleService } from '../sales/data/sale.service';
import { ProductionService } from '../productions/data/production.service';

import { ProductIdeaService } from '../product-ideas/data/product-idea.service';
import { NotificationService } from '../../core/services/notification.service';
import { ApiResponse } from '../../core/models/api-response.model';
import { UserListData } from '../../core/models/user.model';
import { ProductListData } from '../../core/models/product.model';
import { RawMaterialListData } from '../../core/models/raw-material.model';
import { InventoryListData } from '../../core/models/inventory.model';
import { PurchaseListData } from '../../core/models/purchase.model';
import { SaleListData } from '../../core/models/sale.model';
import { ProductionListData } from '../../core/models/production.model';
import { ProfitabilityListData } from '../../core/models/profitability.model';
import { ProductIdeaListData } from '../../core/models/product-idea.model';
import { ProfitabilityService } from '../profitability/data/profitability.service';

interface DashboardStatCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  route?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    ProgressBarModule,
    TagModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly userService = inject(UserService);
  private readonly productService = inject(ProductService);
  private readonly rawMaterialService = inject(RawMaterialService);
  private readonly inventoryService = inject(InventoryService);
  private readonly purchaseService = inject(PurchaseService);
  private readonly saleService = inject(SaleService);
  private readonly productionService = inject(ProductionService);
  private readonly profitabilityService = inject(ProfitabilityService);
  private readonly productIdeaService = inject(ProductIdeaService);
  private readonly notificationService = inject(NotificationService);

  readonly loading = signal(false);

  readonly usersCount = signal(0);
  readonly productsCount = signal(0);
  readonly rawMaterialsCount = signal(0);
  readonly lowStockCount = signal(0);
  readonly purchasesCount = signal(0);
  readonly salesCount = signal(0);
  readonly productionsCount = signal(0);
  readonly profitableCount = signal(0);
  readonly ideasCount = signal(0);

  readonly recentSales = signal<Array<{ invoice_number: string | null; customer_name: string | null; total: string; status: string; sale_date: string }>>([]);
  readonly recentPurchases = signal<Array<{ invoice_number: string | null; total: string; purchase_date: string; supplier?: { business_name: string } | null }>>([]);
  readonly recentProductions = signal<Array<{ batch_number: string; production_date: string; status: string; product?: { name: string } | null }>>([]);
  readonly lowStockItems = signal<Array<{ name: string; code: string; current_stock: string; minimum_stock: string; inventory_type: string }>>([]);

  readonly statCards = computed<DashboardStatCard[]>(() => [
    {
      title: 'Usuarios',
      value: this.usersCount(),
      subtitle: 'Usuarios registrados',
      icon: 'pi pi-users',
      route: '/app/users'
    },
    {
      title: 'Productos',
      value: this.productsCount(),
      subtitle: 'Productos activos y registrados',
      icon: 'pi pi-box',
      route: '/app/products'
    },
    {
      title: 'Materias primas',
      value: this.rawMaterialsCount(),
      subtitle: 'Insumos y materiales',
      icon: 'pi pi-database',
      route: '/app/raw-materials'
    },
    {
      title: 'Stock bajo',
      value: this.lowStockCount(),
      subtitle: 'Alertas actuales',
      icon: 'pi pi-exclamation-triangle',
      route: '/app/inventory'
    },
    {
      title: 'Compras',
      value: this.purchasesCount(),
      subtitle: 'Registros de compra',
      icon: 'pi pi-shopping-cart',
      route: '/app/purchases'
    },
    {
      title: 'Ventas',
      value: this.salesCount(),
      subtitle: 'Registros de venta',
      icon: 'pi pi-money-bill',
      route: '/app/sales'
    },
    {
      title: 'Producción',
      value: this.productionsCount(),
      subtitle: 'Lotes registrados',
      icon: 'pi pi-cog',
      route: '/app/productions'
    },
    {
      title: 'Ideas de producto',
      value: this.ideasCount(),
      subtitle: 'Simulaciones registradas',
      icon: 'pi pi-lightbulb',
      route: '/app/product-ideas'
    }
  ]);

  constructor() {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);

    forkJoin({
      users: this.userService.getUsers({ page: 1, per_page: 1 }),
      products: this.productService.getProducts({ page: 1, per_page: 1 }),
      rawMaterials: this.rawMaterialService.getRawMaterials({ page: 1, per_page: 1 }),
      inventoryLow: this.inventoryService.getInventories({ page: 1, per_page: 5, low_stock: true }),
      purchases: this.purchaseService.getPurchases({ page: 1, per_page: 5 }),
      sales: this.saleService.getSales({ page: 1, per_page: 5 }),
      productions: this.productionService.getProductions({ page: 1, per_page: 5 }),
      profitability: this.profitabilityService.getProductProfitability({ page: 1, per_page: 50 }),
      productIdeas: this.productIdeaService.getProductIdeas({ page: 1, per_page: 1 })
    }).subscribe({
      next: (result) => {
        const usersResponse = result.users as ApiResponse<UserListData>;
        const productsResponse = result.products as ApiResponse<ProductListData>;
        const rawMaterialsResponse = result.rawMaterials as ApiResponse<RawMaterialListData>;
        const inventoryLowResponse = result.inventoryLow as ApiResponse<InventoryListData>;
        const purchasesResponse = result.purchases as ApiResponse<PurchaseListData>;
        const salesResponse = result.sales as ApiResponse<SaleListData>;
        const productionsResponse = result.productions as ApiResponse<ProductionListData>;
        const profitabilityResponse = result.profitability as ApiResponse<ProfitabilityListData>;
        const productIdeasResponse = result.productIdeas as ApiResponse<ProductIdeaListData>;

        this.usersCount.set(usersResponse.data.pagination.total);
        this.productsCount.set(productsResponse.data.pagination.total);
        this.rawMaterialsCount.set(rawMaterialsResponse.data.pagination.total);
        this.lowStockCount.set(inventoryLowResponse.data.pagination.total);
        this.purchasesCount.set(purchasesResponse.data.pagination.total);
        this.salesCount.set(salesResponse.data.pagination.total);
        this.productionsCount.set(productionsResponse.data.pagination.total);
        this.ideasCount.set(productIdeasResponse.data.pagination.total);

        this.profitableCount.set(
          profitabilityResponse.data.items.filter(item => item.result === 'rentable').length
        );

        this.lowStockItems.set(
          inventoryLowResponse.data.items.map(item => ({
            name: item.item?.name ?? '-',
            code: item.item?.code ?? '-',
            current_stock: item.current_stock,
            minimum_stock: item.minimum_stock,
            inventory_type: item.inventory_type
          }))
        );

        this.recentSales.set(
          salesResponse.data.items.map(item => ({
            invoice_number: item.invoice_number,
            customer_name: item.customer_name,
            total: item.total,
            status: item.status,
            sale_date: item.sale_date
          }))
        );

        this.recentPurchases.set(
          purchasesResponse.data.items.map(item => ({
            invoice_number: item.invoice_number,
            total: item.total,
            purchase_date: item.purchase_date,
            supplier: item.supplier
          }))
        );

        this.recentProductions.set(
          productionsResponse.data.items.map(item => ({
            batch_number: item.batch_number,
            production_date: item.production_date,
            status: item.status,
            product: item.product
          }))
        );

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error(
          'Error al cargar dashboard',
          'No fue posible cargar los indicadores generales.'
        );
      }
    });
  }

  getSaleStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'registered':
        return 'success';
      case 'pending':
        return 'warn';
      case 'cancelled':
        return 'danger';
      case 'paid':
        return 'info';
      default:
        return 'info';
    }
  }

  getProductionStatusSeverity(status: string): 'success' | 'warn' | 'danger' {
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

  getLowStockPercent(current: string, minimum: string): number {
    const currentValue = Number(current);
    const minimumValue = Number(minimum);

    if (minimumValue <= 0) return 0;

    const percent = (currentValue / minimumValue) * 100;
    return Math.max(0, Math.min(100, percent));
  }
}
