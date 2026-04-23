export interface RawMaterialSupplierOption {
  id: number;
  business_name: string;
}

export interface RawMaterialSupplierSummary {
  id: number;
  business_name: string;
}

export interface RawMaterial {
  id: number;
  supplier_id: number | null;
  supplier?: RawMaterialSupplierSummary | null;
  code: string;
  name: string;
  description: string | null;
  material_type: string;
  unit_measure: string;
  cost_per_unit: string;
  minimum_stock: string | null;
  expiration_date: string | null;
  image_url: string | null;
  image_public_id: string | null;
  status: boolean;
  created_at: string;
}

export interface RawMaterialPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface RawMaterialListData {
  items: RawMaterial[];
  pagination: RawMaterialPaginationMeta;
}

export interface RawMaterialPayload {
  supplier_id: number | null;
  code: string;
  name: string;
  description: string | null;
  material_type: string;
  unit_measure: string;
  cost_per_unit: number;
  minimum_stock: number | null;
  expiration_date: string | null;
  status: boolean;
}
