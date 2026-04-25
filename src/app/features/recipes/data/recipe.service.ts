import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  Recipe,
  RecipeListData,
  RecipePayload
} from '../../../core/models/recipe.model';

export interface RecipeQueryParams {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  per_page?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getRecipes(params: RecipeQueryParams): Observable<ApiResponse<RecipeListData>> {
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

    return this.http.get<ApiResponse<RecipeListData>>(
      `${this.apiUrl}/recipes`,
      { params: httpParams }
    );
  }

  getRecipe(id: number): Observable<ApiResponse<Recipe>> {
    return this.http.get<ApiResponse<Recipe>>(`${this.apiUrl}/recipes/${id}`);
  }

  createRecipe(payload: RecipePayload): Observable<ApiResponse<Recipe>> {
    return this.http.post<ApiResponse<Recipe>>(`${this.apiUrl}/recipes`, payload);
  }

  updateRecipe(id: number, payload: RecipePayload): Observable<ApiResponse<Recipe>> {
    return this.http.put<ApiResponse<Recipe>>(`${this.apiUrl}/recipes/${id}`, payload);
  }
}
