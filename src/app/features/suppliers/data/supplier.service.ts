import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  Supplier,
  SupplierListData,
  SupplierPayload
} from '../../../core/models/supplier.model';

export interface SupplierQueryParams {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  per_page?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getSuppliers(params: SupplierQueryParams): Observable<ApiResponse<SupplierListData>> {
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

    return this.http.get<ApiResponse<SupplierListData>>(
      `${this.apiUrl}/suppliers`,
      { params: httpParams }
    );
  }

  getActiveSuppliers(): Observable<ApiResponse<Array<{ id: number; business_name: string }>>> {
    return this.http.get<ApiResponse<Array<{ id: number; business_name: string }>>>(
      `${this.apiUrl}/suppliers/active/list`
    );
  }

  createSupplier(payload: SupplierPayload): Observable<ApiResponse<Supplier>> {
    return this.http.post<ApiResponse<Supplier>>(
      `${this.apiUrl}/suppliers`,
      payload
    );
  }

  updateSupplier(id: number, payload: SupplierPayload): Observable<ApiResponse<Supplier>> {
    return this.http.put<ApiResponse<Supplier>>(
      `${this.apiUrl}/suppliers/${id}`,
      payload
    );
  }

  deleteSupplier(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.apiUrl}/suppliers/${id}`
    );
  }
}
