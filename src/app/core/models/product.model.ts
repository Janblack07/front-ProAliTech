export interface ProductCategorySummary {
  id: number;
  name: string;
}

export interface ProductCategoryOption {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  category_id: number;
  category?: ProductCategorySummary | null;
  code: string;
  name: string;
  description: string | null;
  unit_measure: string;
  cost_price: string;
  sale_price: string;
  minimum_stock: string | null;
  shelf_life_days: number | null;
  image_url: string | null;
  image_public_id: string | null;
  status: boolean;
  created_at: string;
}

export interface ProductPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ProductListData {
  items: Product[];
  pagination: ProductPaginationMeta;
}

export interface ProductPayload {
  category_id: number;
  code: string;
  name: string;
  description: string | null;
  unit_measure: string;
  cost_price: number;
  sale_price: number;
  minimum_stock: number | null;
  shelf_life_days: number | null;
  status: boolean;
  image?: File | null;
}
