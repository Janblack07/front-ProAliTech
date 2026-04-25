import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  Product,
  ProductListData,
  ProductPayload
} from '../../../core/models/product.model';

export interface ProductQueryParams {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  category_id?: number | null;
  page?: number;
  per_page?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getProducts(params: ProductQueryParams): Observable<ApiResponse<ProductListData>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('per_page', String(params.per_page ?? 10));

    if (params.search?.trim()) {
      httpParams = httpParams.set('search', params.search.trim());
    }

    if (params.status === 'active') {
      httpParams = httpParams.set('status', 'true');
    }

    if (params.status === 'inactive') {
      httpParams = httpParams.set('status', 'false');
    }

    if (params.category_id) {
      httpParams = httpParams.set('category_id', String(params.category_id));
    }

    return this.http.get<ApiResponse<ProductListData>>(
      `${this.apiUrl}/products`,
      { params: httpParams }
    );
  }

  createProduct(payload: ProductPayload): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(
      `${this.apiUrl}/products`,
      this.buildFormData(payload)
    );
  }

  updateProduct(id: number, payload: ProductPayload): Observable<ApiResponse<Product>> {
    const formData = this.buildFormData(payload);
    formData.append('_method', 'PUT');

    return this.http.post<ApiResponse<Product>>(
      `${this.apiUrl}/products/${id}`,
      formData
    );
  }

  deleteProduct(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.apiUrl}/products/${id}`
    );
  }

  private buildFormData(payload: ProductPayload): FormData {
    const formData = new FormData();

    formData.append('category_id', String(payload.category_id));
    formData.append('code', payload.code);
    formData.append('name', payload.name);
    formData.append('unit_measure', payload.unit_measure);
    formData.append('cost_price', String(payload.cost_price));
    formData.append('sale_price', String(payload.sale_price));
    formData.append('status', payload.status ? '1' : '0');

    if (payload.description !== null) {
      formData.append('description', payload.description);
    }

    if (payload.minimum_stock !== null) {
      formData.append('minimum_stock', String(payload.minimum_stock));
    }

    if (payload.shelf_life_days !== null) {
      formData.append('shelf_life_days', String(payload.shelf_life_days));
    }

    if (payload.image) {
      formData.append('image', payload.image);
    }

    return formData;
  }
  getActiveProducts(): Observable<ApiResponse<Array<{ id: number; name: string; code: string }>>> {
  return this.http.get<ApiResponse<Array<{ id: number; name: string; code: string }>>>(
    `${this.apiUrl}/products/active/list`
  );
}
}
