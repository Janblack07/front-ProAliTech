export interface RecipeProductSummary {
  id: number;
  name: string;
  code: string;
}

export interface RecipeRawMaterialSummary {
  id: number;
  name: string;
  code: string;
  unit_measure: string;
}

export interface RecipeDetail {
  id?: number;
  raw_material_id: number;
  raw_material?: RecipeRawMaterialSummary | null;
  quantity: string;
  unit_measure: string;
  estimated_unit_cost?: string;
  estimated_total_cost?: string;
}

export interface Recipe {
  id: number;
  product_id: number;
  product?: RecipeProductSummary | null;
  recipe_name: string;
  expected_yield: string;
  unit_measure: string;
  estimated_labor_cost: string | null;
  estimated_energy_cost: string | null;
  estimated_indirect_cost: string | null;
  estimated_waste_percent: string | null;
  instructions: string | null;
  status: boolean;
  details: RecipeDetail[];
  created_at: string;
}

export interface RecipePaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface RecipeListData {
  items: Recipe[];
  pagination: RecipePaginationMeta;
}

export interface RecipeDetailPayload {
  raw_material_id: number;
  quantity: number;
  unit_measure: string;
}

export interface RecipePayload {
  product_id: number;
  recipe_name: string;
  expected_yield: number;
  unit_measure: string;
  estimated_labor_cost: number | null;
  estimated_energy_cost: number | null;
  estimated_indirect_cost: number | null;
  estimated_waste_percent: number | null;
  instructions: string | null;
  status: boolean;
  details: RecipeDetailPayload[];
}
