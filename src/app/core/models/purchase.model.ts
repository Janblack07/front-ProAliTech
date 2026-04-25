export interface PurchaseSupplierSummary {
  id: number;
  business_name: string;
}

export interface PurchaseUserSummary {
  id: number;
  name: string;
  lastname: string | null;
}

export interface PurchaseRawMaterialSummary {
  id: number;
  name: string;
  code: string;
  unit_measure: string;
}

export interface PurchaseDetail {
  id: number;
  raw_material_id: number;
  raw_material?: PurchaseRawMaterialSummary | null;
  quantity: string;
  unit_price: string;
  subtotal: string;
  expiration_date: string | null;
  batch_number: string | null;
}

export interface Purchase {
  id: number;
  supplier?: PurchaseSupplierSummary | null;
  user?: PurchaseUserSummary | null;
  purchase_date: string;
  invoice_number: string | null;
  subtotal: string;
  tax: string;
  total: string;
  notes: string | null;
  status: string;
  details: PurchaseDetail[];
  created_at: string;
}

export interface PurchasePaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PurchaseListData {
  items: Purchase[];
  pagination: PurchasePaginationMeta;
}

export interface PurchaseDetailPayload {
  raw_material_id: number;
  quantity: number;
  unit_price: number;
  expiration_date: string | null;
  batch_number: string | null;
}

export interface PurchasePayload {
  supplier_id: number;
  purchase_date: string;
  invoice_number: string | null;
  tax: number | null;
  notes: string | null;
  details: PurchaseDetailPayload[];
}
