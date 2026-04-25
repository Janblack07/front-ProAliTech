import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  ProfitabilityListData
} from '../../../core/models/profitability.model';

export interface ProfitabilityQueryParams {
  search?: string;
  page?: number;
  per_page?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProfitabilityService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getProductProfitability(
    params: ProfitabilityQueryParams
  ): Observable<ApiResponse<ProfitabilityListData>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('per_page', String(params.per_page ?? 10));

    if (params.search?.trim()) {
      httpParams = httpParams.set('search', params.search.trim());
    }

    return this.http.get<ApiResponse<ProfitabilityListData>>(
      `${this.apiUrl}/analytics/profitability/products`,
      { params: httpParams }
    );
  }
}
