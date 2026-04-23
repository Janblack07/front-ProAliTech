import { Routes } from '@angular/router';
import { AppLayoutComponent } from './app-layout.component';
import { authGuard } from '../../../core/guards/auth.guard';

export const APP_LAYOUT_ROUTES: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../../../features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          )
      },
      {
        path: 'users',
        loadComponent: () =>
          import('../../../features/users/users.component').then(
            (m) => m.UsersComponent
          )
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('../../../features/categories/categories.component').then(
            (m) => m.CategoriesComponent
          )
      },
      {
        path: 'suppliers',
        loadComponent: () =>
          import('../../../features/suppliers/suppliers.component').then(
            (m) => m.SuppliersComponent
          )
      },
      {
        path: 'raw-materials',
        loadComponent: () =>
          import('../../../features/raw-materials/raw-materials.component').then(
            (m) => m.RawMaterialsComponent
          )
      },
      {
        path: 'products',
        loadComponent: () =>
          import('../../../features/products/products.component').then(
            (m) => m.ProductsComponent
          )
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('../../../features/inventory/inventory.component').then(
            (m) => m.InventoryComponent
          )
      },
      {
        path: 'purchases',
        loadComponent: () =>
          import('../../../features/purchases/purchases.component').then(
            (m) => m.PurchasesComponent
          )
      },
      {
        path: 'sales',
        loadComponent: () =>
          import('../../../features/sales/sales.component').then(
            (m) => m.SalesComponent
          )
      },
      {
        path: 'recipes',
        loadComponent: () =>
          import('../../../features/recipes/recipes.component').then(
            (m) => m.RecipesComponent
          )
      },
      {
        path: 'productions',
        loadComponent: () =>
          import('../../../features/productions/productions.component').then(
            (m) => m.ProductionsComponent
          )
      },
      {
        path: 'product-ideas',
        loadComponent: () =>
          import('../../../features/product-ideas/product-ideas.component').then(
            (m) => m.ProductIdeasComponent
          )
      },
      {
        path: 'profitability',
        loadComponent: () =>
          import('../../../features/profitability/profitability.component').then(
            (m) => m.ProfitabilityComponent
          )
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }
    ]
  }
];
