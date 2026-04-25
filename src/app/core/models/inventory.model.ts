export interface InventoryItemSummary {
  id: number;
  name: string;
  code: string;
  image_url: string | null;
}

export interface Inventory {
  id: number;
  inventory_type: 'product' | 'raw_material';
  product_id: number | null;
  raw_material_id: number | null;
  item: InventoryItemSummary | null;
  current_stock: string;
  unit_measure: string;
  minimum_stock: string;
  is_low_stock: boolean;
  last_movement_at: string | null;
  created_at: string;
}

export interface InventoryPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface InventoryListData {
  items: Inventory[];
  pagination: InventoryPaginationMeta;
}

export interface InventoryUserSummary {
  id: number | null;
  name: string | null;
  lastname: string | null;
}

export interface InventoryMovement {
  id: number;
  inventory_id: number;
  user?: InventoryUserSummary | null;
  movement_type: 'entry' | 'exit' | 'adjustment' | 'waste' | 'return';
  reference_type: 'purchase' | 'sale' | 'production' | 'adjustment' | 'manual' | null;
  reference_id: number | null;
  quantity: string;
  stock_before: string;
  stock_after: string;
  movement_date: string;
  description: string | null;
  created_at: string;
}

export interface InventoryMovementListData {
  items: InventoryMovement[];
  pagination: InventoryPaginationMeta;
}

export interface AdjustInventoryPayload {
  movement_type: 'entry' | 'exit' | 'adjustment' | 'waste' | 'return';
  quantity: number;
  description: string | null;
}
