export interface ProfitabilityItem {
  id: number;
  code: string;
  name: string;
  category: string | null;
  cost_price: number;
  sale_price: number;
  profit: number;
  margin_percent: number;
  result: string;
}

export interface ProfitabilityPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ProfitabilityListData {
  items: ProfitabilityItem[];
  pagination: ProfitabilityPaginationMeta;
}
