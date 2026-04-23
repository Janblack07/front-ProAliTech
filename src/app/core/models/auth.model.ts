export interface AuthUser {
  id: number;
  name: string;
  email: string;
  status?: boolean | number;
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  token_type: string;
  user: AuthUser;
  roles: string[];
  permissions: string[];
}

export interface MeResponseData {
  user: AuthUser;
  roles: string[];
  permissions: string[];
}

export interface AuthSession {
  token: string;
  tokenType: string;
  user: AuthUser;
  roles: string[];
  permissions: string[];
}
