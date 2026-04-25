import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  Purchase,
  PurchaseListData,
  PurchasePayload
} from '../../../core/models/purchase.model';

export interface PurchaseQueryParams {
  search?: string;
  status?: string | null;
  page?: number;
  per_page?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getPurchases(params: PurchaseQueryParams): Observable<ApiResponse<PurchaseListData>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('per_page', String(params.per_page ?? 10));

    if (params.search?.trim()) {
      httpParams = httpParams.set('search', params.search.trim());
    }

    if (params.status?.trim()) {
      httpParams = httpParams.set('status', params.status.trim());
    }

    return this.http.get<ApiResponse<PurchaseListData>>(
      `${this.apiUrl}/purchases`,
      { params: httpParams }
    );
  }

  getPurchase(id: number): Observable<ApiResponse<Purchase>> {
    return this.http.get<ApiResponse<Purchase>>(
      `${this.apiUrl}/purchases/${id}`
    );
  }

  createPurchase(payload: PurchasePayload): Observable<ApiResponse<Purchase>> {
    return this.http.post<ApiResponse<Purchase>>(
      `${this.apiUrl}/purchases`,
      payload
    );
  }
}
