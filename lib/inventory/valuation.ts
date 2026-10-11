import { round2 } from '../utils/formatters';

/**
 * Calculates new Weighted Average Unit Cost (WAC) when receiving a purchase.
 *
 * Formula:
 * New WAC = ((currentQty * currentAvgCost) + (purchasedQty * purchaseUnitPrice)) / (currentQty + purchasedQty)
 *
 * If current stock is 0 or negative, the new unit cost is simply the purchase unit price.
 */
export function calculateWeightedAverageCost(
  currentQty: number,
  currentAvgCost: number,
  purchasedQty: number,
  purchaseUnitPrice: number
): number {
  if (purchasedQty <= 0) return currentAvgCost;
  
  const effectiveCurrentQty = Math.max(0, currentQty);
  const totalCurrentCost = effectiveCurrentQty * currentAvgCost;
  const totalPurchaseCost = purchasedQty * purchaseUnitPrice;
  const totalNewQty = effectiveCurrentQty + purchasedQty;

  if (totalNewQty <= 0) return purchaseUnitPrice;

  return round2((totalCurrentCost + totalPurchaseCost) / totalNewQty);
}

/**
 * Calculates stock valuation: available quantity * average unit cost
 */
export function calculateStockValuation(qty: number, avgCost: number): number {
  return round2(Math.max(0, qty) * avgCost);
}

