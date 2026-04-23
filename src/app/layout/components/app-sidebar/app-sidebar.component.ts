import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';

import { AppMenuItem } from '../../../core/models/menu-item.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass],
  templateUrl: './app-sidebar.component.html',
  styleUrl: './app-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppSidebarComponent {
  readonly collapsed = input<boolean>(false);

  readonly menuItems: AppMenuItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/app/dashboard' },
    { label: 'Usuarios', icon: 'pi pi-users', route: '/app/users' },
    { label: 'Categorías', icon: 'pi pi-tags', route: '/app/categories' },
    { label: 'Proveedores', icon: 'pi pi-truck', route: '/app/suppliers' },
    { label: 'Materias primas', icon: 'pi pi-box', route: '/app/raw-materials' },
    { label: 'Productos', icon: 'pi pi-shopping-bag', route: '/app/products' },
    { label: 'Inventario', icon: 'pi pi-warehouse', route: '/app/inventory' },
    { label: 'Compras', icon: 'pi pi-shopping-cart', route: '/app/purchases' },
    { label: 'Ventas', icon: 'pi pi-dollar', route: '/app/sales' },
    { label: 'Recetas', icon: 'pi pi-book', route: '/app/recipes' },
    { label: 'Producción', icon: 'pi pi-cog', route: '/app/productions' },
    { label: 'Ideas de producto', icon: 'pi pi-lightbulb', route: '/app/product-ideas' },
    { label: 'Rentabilidad', icon: 'pi pi-chart-line', route: '/app/profitability' }
  ];
}
