import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  AdjustInventoryPayload,
  Inventory,
  InventoryListData,
  InventoryMovementListData
} from '../../../core/models/inventory.model';

export interface InventoryQueryParams {
  search?: string;
  inventory_type?: 'all' | 'product' | 'raw_material';
  low_stock?: boolean;
  page?: number;
  per_page?: number;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getInventories(params: InventoryQueryParams): Observable<ApiResponse<InventoryListData>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('per_page', String(params.per_page ?? 10));

    if (params.search?.trim()) {
      httpParams = httpParams.set('search', params.search.trim());
    }

    if (params.inventory_type && params.inventory_type !== 'all') {
      httpParams = httpParams.set('inventory_type', params.inventory_type);
    }

    if (params.low_stock === true) {
      httpParams = httpParams.set('low_stock', 'true');
    }

    return this.http.get<ApiResponse<InventoryListData>>(
      `${this.apiUrl}/inventories`,
      { params: httpParams }
    );
  }

  getInventory(id: number): Observable<ApiResponse<Inventory>> {
    return this.http.get<ApiResponse<Inventory>>(
      `${this.apiUrl}/inventories/${id}`
    );
  }

  getInventoryMovements(
    inventoryId: number,
    page = 1,
    per_page = 10
  ): Observable<ApiResponse<InventoryMovementListData>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('per_page', String(per_page));

    return this.http.get<ApiResponse<InventoryMovementListData>>(
      `${this.apiUrl}/inventories/${inventoryId}/movements`,
      { params }
    );
  }

  adjustInventory(
    inventoryId: number,
    payload: AdjustInventoryPayload
  ): Observable<ApiResponse<Inventory>> {
    return this.http.post<ApiResponse<Inventory>>(
      `${this.apiUrl}/inventories/${inventoryId}/adjust`,
      payload
    );
  }
}
