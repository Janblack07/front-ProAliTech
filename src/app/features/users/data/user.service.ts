import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  UserItem,
  UserListData,
  UserPayload
} from '../../../core/models/user.model';

export interface UserQueryParams {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  per_page?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getUsers(params: UserQueryParams): Observable<ApiResponse<UserListData>> {
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

    return this.http.get<ApiResponse<UserListData>>(
      `${this.apiUrl}/users`,
      { params: httpParams }
    );
  }

  getUser(id: number): Observable<ApiResponse<UserItem>> {
    return this.http.get<ApiResponse<UserItem>>(
      `${this.apiUrl}/users/${id}`
    );
  }

  createUser(payload: UserPayload): Observable<ApiResponse<UserItem>> {
    return this.http.post<ApiResponse<UserItem>>(
      `${this.apiUrl}/users`,
      payload
    );
  }

  updateUser(id: number, payload: UserPayload): Observable<ApiResponse<UserItem>> {
    return this.http.put<ApiResponse<UserItem>>(
      `${this.apiUrl}/users/${id}`,
      payload
    );
  }

  deleteUser(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.apiUrl}/users/${id}`
    );
  }

  getRoles(): Observable<ApiResponse<Array<{ id: number; name: string }>>> {
    return this.http.get<ApiResponse<Array<{ id: number; name: string }>>>(
      `${this.apiUrl}/roles`
    );
  }
}
