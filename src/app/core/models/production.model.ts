export interface ProductionProductSummary {
  id: number;
  name: string;
  code: string;
}

export interface ProductionRecipeSummary {
  id: number | null;
  recipe_name: string | null;
}

export interface ProductionUserSummary {
  id: number;
  name: string;
  lastname: string | null;
}

export interface ProductionRawMaterialSummary {
  id: number;
  name: string;
  code: string;
  unit_measure: string;
}

export interface ProductionDetail {
  id: number;
  raw_material_id: number;
  raw_material?: ProductionRawMaterialSummary | null;
  quantity_used: string;
  unit_measure: string;
  unit_cost: string;
  total_cost: string;
  batch_number: string | null;
  expiration_date: string | null;
}

export interface Production {
  id: number;
  product?: ProductionProductSummary | null;
  recipe?: ProductionRecipeSummary | null;
  user?: ProductionUserSummary | null;
  batch_number: string;
  production_date: string;
  expected_quantity: string;
  produced_quantity: string;
  unit_measure: string;
  labor_cost: string | null;
  energy_cost: string | null;
  indirect_cost: string | null;
  waste_quantity: string | null;
  total_cost: string;
  unit_cost: string;
  notes: string | null;
  status: 'in_progress' | 'completed' | 'cancelled';
  details: ProductionDetail[];
  created_at: string;
}

export interface ProductionPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ProductionListData {
  items: Production[];
  pagination: ProductionPaginationMeta;
}

export interface ProductionDetailPayload {
  raw_material_id: number;
  quantity_used: number;
  unit_measure: string;
  batch_number: string | null;
  expiration_date: string | null;
}

export interface ProductionPayload {
  product_id: number;
  recipe_id: number | null;
  batch_number: string;
  production_date: string;
  expected_quantity: number;
  produced_quantity: number;
  unit_measure: string;
  labor_cost: number | null;
  energy_cost: number | null;
  indirect_cost: number | null;
  waste_quantity: number | null;
  notes: string | null;
  details: ProductionDetailPayload[];
}
