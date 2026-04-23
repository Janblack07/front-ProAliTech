export interface Supplier {
  id: number;
  business_name: string;
  ruc: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: boolean;
  created_at: string;
}

export interface SupplierPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface SupplierListData {
  items: Supplier[];
  pagination: SupplierPaginationMeta;
}

export interface SupplierPayload {
  business_name: string;
  ruc: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: boolean;
}
