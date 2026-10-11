'use client';

import React, { useState } from 'react';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { formatCurrency, formatDate, getTodayDateString, round2 } from '../../../lib/utils/formatters';
import { StockAdjustment } from '../../../types/inventory';

export default function StockAdjustmentsPage() {
  const { stockAdjustments, items, stockStatusList, saveStockAdjustment } = useERPStorage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [date, setDate] = useState(getTodayDateString());
  const [itemId, setItemId] = useState(items[0]?.id || '');
  const [type, setType] = useState<StockAdjustment['type']>('WASTAGE');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('Spoilage due to refrigerator power outage');
  const [notes, setNotes] = useState('');

  const selectedItem = items.find((i) => i.id === itemId);
  const selectedStock = stockStatusList.find((s) => s.itemId === itemId);

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || !selectedItem) return;

    const qty = parseFloat(quantity) || 0;
    const isDeduction = type === 'WASTAGE' || type === 'SPOILAGE' || type === 'EXPIRED' || type === 'BREAKAGE' || type === 'PHYSICAL_COUNT_DEFICIT';
    const effectiveQty = isDeduction ? -Math.abs(qty) : Math.abs(qty);
    const unitCost = selectedItem.costPrice;
    const totalAmount = round2(effectiveQty * unitCost);

    const adj: StockAdjustment = {
      id: `adj-${Date.now()}`,
      adjustmentNumber: `ADJ-2026-00${stockAdjustments.length + 1}`,
      date,
      itemId,
      type,
      quantity: effectiveQty,
      unitCost,
      totalAmount,
      reason,
      notes,
      isPosted: true,
      createdAt: new Date().toISOString(),
    };

    await saveStockAdjustment(adj);
    setIsModalOpen(false);
    setQuantity('1');
    setReason('');
    setNotes('');
  };

  return (
    <PageContainer
      title="Stock Adjustments & Wastage"
      subtitle="Audit spoilage, breakage, expiry, and physical stock count discrepancies"
      actions={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Icons.Plus size={14} />
          <span>Record Adjustment / Wastage</span>
        </Button>
      }
    >
      <Card>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Adj #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Adjustment Type</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Amount (PKR)</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {stockAdjustments.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-zinc-400 text-xs">
                  No stock adjustments or wastage incidents recorded.
                </td>
              </tr>
            ) : (
              stockAdjustments.map((adj) => {
                const it = items.find((i) => i.id === adj.itemId);

                return (
                  <TableRow key={adj.id}>
                    <TableCell className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {adj.adjustmentNumber}
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(adj.date)}</TableCell>
                    <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {it?.name || 'Item'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={adj.quantity < 0 ? 'danger' : 'success'}>
                        {adj.type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs">
                      {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity} {it?.unit}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatCurrency(adj.unitCost)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                      {formatCurrency(Math.abs(adj.totalAmount))}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500 max-w-[200px] truncate">
                      {adj.reason}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">Posted to GL</Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Record Adjustment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Stock Adjustment or Wastage"
        description="Posts inventory reduction and loss expense into General Ledger"
      >
        <form onSubmit={handleCreateAdjustment} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Adjustment Reason / Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as StockAdjustment['type'])}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <option value="WASTAGE">Kitchen Wastage / Spoilage</option>
                <option value="EXPIRED">Expired Ingredients</option>
                <option value="BREAKAGE">Breakage / Damage</option>
                <option value="PHYSICAL_COUNT_DEFICIT">Physical Count Deficit (Shortage)</option>
                <option value="PHYSICAL_COUNT_SURPLUS">Physical Count Surplus (Found Stock)</option>
                <option value="CORRECTION">Manual Inventory Correction</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Select Item
            </label>
            <select
              required
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  [{i.code}] {i.name} ({i.unit}) — Available: {stockStatusList.find(s => s.itemId === i.id)?.availableQty || 0}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Quantity ({selectedItem?.unit || ''})
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Current WAC Unit Cost
              </label>
              <input
                type="text"
                disabled
                value={formatCurrency(selectedItem?.costPrice || 0)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Specific Reason / Cause
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Milk turned sour; BBQ coal bags soaked by rain"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Internal Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Approved by Head Chef"
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

