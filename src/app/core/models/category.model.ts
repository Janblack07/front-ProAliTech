export interface Category {
  id: number;
  name: string;
  description: string | null;
  status: boolean;
  created_at: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CategoryListData {
  items: Category[];
  pagination: PaginationMeta;
}

export interface CategoryPayload {
  name: string;
  description: string | null;
  status: boolean;
}
