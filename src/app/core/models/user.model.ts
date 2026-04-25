export interface UserRole {
  id: number;
  name: string;
}

export interface UserItem {
  id: number;
  name: string;
  lastname: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  status: boolean;
  last_login_at: string | null;
  roles: UserRole[];
  permissions: string[];
  created_at: string;
}

export interface UserPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface UserListData {
  items: UserItem[];
  pagination: UserPaginationMeta;
}

export interface UserPayload {
  name: string;
  lastname: string | null;
  email: string;
  phone: string | null;
  password?: string | null;
  password_confirmation?: string | null;
  status: boolean;
  roles: string[];
}
