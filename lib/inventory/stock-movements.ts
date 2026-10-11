import { Item, StockMovement, ItemStockStatus, StockAdjustment, ItemCategory } from '../../types/inventory';
import { round2 } from '../utils/formatters';

/**
 * Computes the real-time stock balances and valuation for all items based on stock movements
 */
export function calculateAllItemsStockStatus(
  items: Item[],
  categories: ItemCategory[],
  movements: StockMovement[]
): ItemStockStatus[] {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  return items.map((item) => {
    const itemMovements = movements.filter((m) => m.itemId === item.id);

    let openingQty = 0;
    let purchasedQty = 0;
    let issuedQty = 0;
    let adjustedAddQty = 0;
    let adjustedDeductQty = 0;
    let wastageQty = 0;

    for (const mov of itemMovements) {
      switch (mov.movementType) {
        case 'PURCHASE':
          if (mov.referenceType === 'OPENING') {
            openingQty += mov.quantity;
          } else {
            purchasedQty += mov.quantity;
          }
          break;
        case 'ISSUE':
          issuedQty += mov.quantity;
          break;
        case 'ADJUSTMENT_ADD':
        case 'RETURN_FROM_DEPT':
          adjustedAddQty += mov.quantity;
          break;
        case 'ADJUSTMENT_DEDUCT':
        case 'RETURN_TO_VENDOR':
          adjustedDeductQty += mov.quantity;
          break;
        case 'WASTAGE':
          wastageQty += mov.quantity;
          break;
      }
    }

    const availableQty = round2(
      openingQty + purchasedQty + adjustedAddQty - issuedQty - adjustedDeductQty - wastageQty
    );
    const averageCost = item.costPrice;
    const stockValue = round2(Math.max(0, availableQty) * averageCost);
    const isLowStock = availableQty <= item.minStockLevel;

    return {
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      categoryName: categoryMap.get(item.categoryId) || 'General',
      unit: item.unit,
      openingQty: round2(openingQty),
      purchasedQty: round2(purchasedQty),
      issuedQty: round2(issuedQty),
      adjustedQty: round2(adjustedAddQty - adjustedDeductQty),
      wastageQty: round2(wastageQty),
      availableQty,
      averageCost,
      stockValue,
      minStockLevel: item.minStockLevel,
      isLowStock,
    };
  });
}

/**
 * Validates whether an item has sufficient stock before allowing an issue or deduction
 */
export function validateStockAvailability(
  availableQty: number,
  requestedQty: number,
  itemName: string
): { valid: boolean; error?: string } {
  if (requestedQty <= 0) {
    return { valid: false, error: `Quantity must be greater than zero for ${itemName}.` };
  }
  if (requestedQty > availableQty) {
    return {
      valid: false,
      error: `Insufficient stock for "${itemName}". Available: ${availableQty}, Requested: ${requestedQty}. Negative stock is not allowed.`,
    };
  }
  return { valid: true };
}

