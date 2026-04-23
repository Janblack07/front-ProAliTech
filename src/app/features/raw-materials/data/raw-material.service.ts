import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  RawMaterial,
  RawMaterialListData,
  RawMaterialPayload
} from '../../../core/models/raw-material.model';

export interface RawMaterialQueryParams {
  search?: string;
  material_type?: string;
  page?: number;
  per_page?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RawMaterialService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getRawMaterials(
    params: RawMaterialQueryParams
  ): Observable<ApiResponse<RawMaterialListData>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('per_page', String(params.per_page ?? 10));

    if (params.search?.trim()) {
      httpParams = httpParams.set('search', params.search.trim());
    }

    if (params.material_type?.trim()) {
      httpParams = httpParams.set('material_type', params.material_type.trim());
    }

    return this.http.get<ApiResponse<RawMaterialListData>>(
      `${this.apiUrl}/raw-materials`,
      { params: httpParams }
    );
  }

  createRawMaterial(
    payload: RawMaterialPayload
  ): Observable<ApiResponse<RawMaterial>> {
    return this.http.post<ApiResponse<RawMaterial>>(
      `${this.apiUrl}/raw-materials`,
      payload
    );
  }

  updateRawMaterial(
    id: number,
    payload: RawMaterialPayload
  ): Observable<ApiResponse<RawMaterial>> {
    return this.http.put<ApiResponse<RawMaterial>>(
      `${this.apiUrl}/raw-materials/${id}`,
      payload
    );
  }

  deleteRawMaterial(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.apiUrl}/raw-materials/${id}`
    );
  }
}
