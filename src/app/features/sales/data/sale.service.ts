import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  Sale,
  SaleListData,
  SalePayload
} from '../../../core/models/sale.model';

export interface SaleQueryParams {
  search?: string;
  status?: string | null;
  page?: number;
  per_page?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getSales(params: SaleQueryParams): Observable<ApiResponse<SaleListData>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('per_page', String(params.per_page ?? 10));

    if (params.search?.trim()) {
      httpParams = httpParams.set('search', params.search.trim());
    }

    if (params.status?.trim()) {
      httpParams = httpParams.set('status', params.status.trim());
    }

    return this.http.get<ApiResponse<SaleListData>>(
      `${this.apiUrl}/sales`,
      { params: httpParams }
    );
  }

  getSale(id: number): Observable<ApiResponse<Sale>> {
    return this.http.get<ApiResponse<Sale>>(
      `${this.apiUrl}/sales/${id}`
    );
  }

  createSale(payload: SalePayload): Observable<ApiResponse<Sale>> {
    return this.http.post<ApiResponse<Sale>>(
      `${this.apiUrl}/sales`,
      payload
    );
  }
}
