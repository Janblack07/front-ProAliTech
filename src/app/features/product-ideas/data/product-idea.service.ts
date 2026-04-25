import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  ProductEvaluation,
  ProductEvaluationPayload,
  ProductIdea,
  ProductIdeaListData,
  ProductIdeaPayload
} from '../../../core/models/product-idea.model';

export interface ProductIdeaQueryParams {
  search?: string;
  status?: string | null;
  page?: number;
  per_page?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductIdeaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getProductIdeas(params: ProductIdeaQueryParams): Observable<ApiResponse<ProductIdeaListData>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('per_page', String(params.per_page ?? 10));

    if (params.search?.trim()) {
      httpParams = httpParams.set('search', params.search.trim());
    }

    if (params.status?.trim()) {
      httpParams = httpParams.set('status', params.status.trim());
    }

    return this.http.get<ApiResponse<ProductIdeaListData>>(
      `${this.apiUrl}/product-ideas`,
      { params: httpParams }
    );
  }

  getProductIdea(id: number): Observable<ApiResponse<ProductIdea>> {
    return this.http.get<ApiResponse<ProductIdea>>(
      `${this.apiUrl}/product-ideas/${id}`
    );
  }

  createProductIdea(payload: ProductIdeaPayload): Observable<ApiResponse<ProductIdea>> {
    return this.http.post<ApiResponse<ProductIdea>>(
      `${this.apiUrl}/product-ideas`,
      payload
    );
  }

  updateProductIdea(id: number, payload: ProductIdeaPayload): Observable<ApiResponse<ProductIdea>> {
    return this.http.put<ApiResponse<ProductIdea>>(
      `${this.apiUrl}/product-ideas/${id}`,
      payload
    );
  }

  getEvaluations(productIdeaId: number): Observable<ApiResponse<ProductEvaluation[]>> {
    return this.http.get<ApiResponse<ProductEvaluation[]>>(
      `${this.apiUrl}/product-ideas/${productIdeaId}/evaluations`
    );
  }

  createEvaluation(
    productIdeaId: number,
    payload: ProductEvaluationPayload
  ): Observable<ApiResponse<ProductEvaluation>> {
    return this.http.post<ApiResponse<ProductEvaluation>>(
      `${this.apiUrl}/product-ideas/${productIdeaId}/evaluations`,
      payload
    );
  }
}
