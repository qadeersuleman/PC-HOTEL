export type UnitOfMeasure = 'KG' | 'Gram' | 'Litre' | 'ML' | 'Pat' | 'Kg' | 'Pcs' | 'Box' | 'Packet' | 'Dozen';

export interface ItemCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  defaultExpenseAccountId?: string; // e.g. COGS or Operating Expense
}

export interface Item {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  unit: UnitOfMeasure;
  minStockLevel: number;
  costPrice: number; // Current Weighted Average Cost
  sellingPrice?: number;
  isActive: boolean;
  notes?: string;
}

export type MovementType = 
  | 'PURCHASE'
  | 'ISSUE'
  | 'ADJUSTMENT_ADD'
  | 'ADJUSTMENT_DEDUCT'
  | 'WASTAGE'
  | 'RETURN_TO_VENDOR'
  | 'RETURN_FROM_DEPT';

export interface StockMovement {
  id: string;
  itemId: string;
  movementType: MovementType;
  quantity: number; // Always positive magnitude
  unitCost: number;
  totalCost: number;
  referenceType: 'PURCHASE_INVOICE' | 'ISSUE_INVOICE' | 'STOCK_ADJUSTMENT' | 'OPENING';
  referenceId: string;
  referenceNumber: string;
  date: string; // ISO date string (YYYY-MM-DD)
  departmentId?: string;
  notes?: string;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string; // ADJ-0001
  date: string;
  itemId: string;
  type: 'WASTAGE' | 'SPOILAGE' | 'EXPIRED' | 'BREAKAGE' | 'PHYSICAL_COUNT_SURPLUS' | 'PHYSICAL_COUNT_DEFICIT' | 'CORRECTION';
  quantity: number; // positive = added to stock, negative = removed
  unitCost: number;
  totalAmount: number;
  reason: string;
  notes?: string;
  isPosted: boolean;
  createdAt: string;
}

export interface ItemStockStatus {
  itemId: string;
  itemCode: string;
  itemName: string;
  categoryName: string;
  unit: UnitOfMeasure;
  openingQty: number;
  purchasedQty: number;
  issuedQty: number;
  adjustedQty: number; // net of additions and subtractions
  wastageQty: number;
  availableQty: number;
  averageCost: number;
  stockValue: number;
  minStockLevel: number;
  isLowStock: boolean;
}

