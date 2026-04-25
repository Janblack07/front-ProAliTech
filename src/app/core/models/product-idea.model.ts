export interface ProductIdeaCategorySummary {
  id: number;
  name: string;
}

export interface ProductIdeaUserSummary {
  id: number;
  name: string;
  lastname: string | null;
}

export interface ProductEvaluationUserSummary {
  id: number;
  name: string;
  lastname: string | null;
}

export interface ProductEvaluation {
  id: number;
  estimated_total_cost: string | number;
  estimated_unit_cost: string | number;
  proposed_sale_price: string | number;
  estimated_profit: string | number;
  estimated_margin_percent: string | number;
  break_even_quantity: string | number | null;
  viability_result: string;
  recommendation: string;
  evaluation_date: string | null;
  user?: ProductEvaluationUserSummary | null;
}

export interface ProductIdea {
  id: number;
  category_id: number;
  category?: ProductIdeaCategorySummary | null;
  user?: ProductIdeaUserSummary | null;
  idea_name: string;
  description: string | null;
  proposed_sale_price: string | number | null;
  expected_demand: string | null;
  competition_level: string | null;
  estimated_labor_cost: string | number | null;
  estimated_energy_cost: string | number | null;
  estimated_indirect_cost: string | number | null;
  estimated_waste_percent: string | number | null;
  observations: string | null;
  status: string;
  latest_evaluation?: ProductEvaluation | null;
  created_at: string;
}

export interface ProductIdeaPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ProductIdeaListData {
  items: ProductIdea[];
  pagination: ProductIdeaPaginationMeta;
}

export interface ProductIdeaPayload {
  category_id: number;
  idea_name: string;
  description: string | null;
  proposed_sale_price: number | null;
  expected_demand: string | null;
  competition_level: string | null;
  estimated_labor_cost: number | null;
  estimated_energy_cost: number | null;
  estimated_indirect_cost: number | null;
  estimated_waste_percent: number | null;
  observations: string | null;
  status: string | null;
}

export interface ProductEvaluationPayload {
  estimated_total_cost: number;
  estimated_unit_cost: number;
  proposed_sale_price: number;
  fixed_costs: number | null;
  recommendation_notes: string | null;
}
