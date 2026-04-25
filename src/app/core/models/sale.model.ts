export interface SaleUserSummary {
  id: number | null;
  name: string | null;
  lastname: string | null;
}

export interface SaleProductSummary {
  id: number;
  name: string;
  code: string;
  unit_measure: string;
}

export interface SaleDetail {
  id: number;
  product_id: number;
  product?: SaleProductSummary | null;
  quantity: string;
  unit_price: string;
  discount: string;
  subtotal: string;
}

export interface Sale {
  id: number;
  user?: SaleUserSummary | null;
  sale_date: string;
  invoice_number: string | null;
  customer_name: string | null;
  customer_document: string | null;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  notes: string | null;
  status: 'registered' | 'cancelled' | 'paid' | 'pending';
  details: SaleDetail[];
  created_at: string;
}

export interface SalePaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface SaleListData {
  items: Sale[];
  pagination: SalePaginationMeta;
}

export interface SaleDetailPayload {
  product_id: number;
  quantity: number;
  unit_price: number;
  discount: number | null;
}

export interface SalePayload {
  sale_date: string;
  invoice_number: string | null;
  customer_name: string | null;
  customer_document: string | null;
  tax: number | null;
  discount: number | null;
  notes: string | null;
  details: SaleDetailPayload[];
}
