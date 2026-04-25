import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  Category,
  CategoryListData,
  CategoryPayload
} from '../../../core/models/category.model';

export interface CategoryQueryParams {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  per_page?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getCategories(params: CategoryQueryParams): Observable<ApiResponse<CategoryListData>> {
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

    return this.http.get<ApiResponse<CategoryListData>>(
      `${this.apiUrl}/categories`,
      { params: httpParams }
    );
  }
  getActiveCategories(): Observable<ApiResponse<Array<{ id: number; name: string }>>> {
  return this.http.get<ApiResponse<Array<{ id: number; name: string }>>>(
    `${this.apiUrl}/categories/active/list`
  );
}

  createCategory(payload: CategoryPayload): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(
      `${this.apiUrl}/categories`,
      payload
    );
  }

  updateCategory(id: number, payload: CategoryPayload): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(
      `${this.apiUrl}/categories/${id}`,
      payload
    );
  }

  deleteCategory(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.apiUrl}/categories/${id}`
    );
  }
}
