import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  Production,
  ProductionListData,
  ProductionPayload
} from '../../../core/models/production.model';

export interface ProductionQueryParams {
  search?: string;
  status?: 'all' | 'in_progress' | 'completed' | 'cancelled';
  page?: number;
  per_page?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getProductions(params: ProductionQueryParams): Observable<ApiResponse<ProductionListData>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('per_page', String(params.per_page ?? 10));

    if (params.search?.trim()) {
      httpParams = httpParams.set('search', params.search.trim());
    }

    if (params.status && params.status !== 'all') {
      httpParams = httpParams.set('status', params.status);
    }

    return this.http.get<ApiResponse<ProductionListData>>(
      `${this.apiUrl}/productions`,
      { params: httpParams }
    );
  }

  getProduction(id: number): Observable<ApiResponse<Production>> {
    return this.http.get<ApiResponse<Production>>(
      `${this.apiUrl}/productions/${id}`
    );
  }

  createProduction(payload: ProductionPayload): Observable<ApiResponse<Production>> {
    return this.http.post<ApiResponse<Production>>(
      `${this.apiUrl}/productions`,
      payload
    );
  }
}
