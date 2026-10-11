'use client';

import React, { useState } from 'react';
import { PageContainer } from '../../../components/layout/page-container';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { EmptyState } from '../../../components/ui/empty-state';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { useToast } from '../../../components/ui/toast';
import { formatCurrency, formatDate, getTodayDateString, round2 } from '../../../lib/utils/formatters';
import { StockAdjustment } from '../../../types/inventory';

export default function StockAdjustmentsPage() {
  const { stockAdjustments, items, stockStatusList, saveStockAdjustment } = useERPStorage();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [date, setDate] = useState(getTodayDateString());
  const [itemId, setItemId] = useState(items[0]?.id || '');
  const [type, setType] = useState<StockAdjustment['type']>('WASTAGE');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('Spoilage due to refrigerator power outage');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedItem = items.find((i) => i.id === itemId);
  const selectedStock = stockStatusList.find((s) => s.itemId === itemId);

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || !selectedItem) {
      toast.error('Validation Error', 'Please select an item to adjust.');
      return;
    }

    const qty = parseFloat(quantity) || 0;
    const isDeduction = type === 'WASTAGE' || type === 'SPOILAGE' || type === 'EXPIRED' || type === 'BREAKAGE' || type === 'PHYSICAL_COUNT_DEFICIT';
    const effectiveQty = isDeduction ? -Math.abs(qty) : Math.abs(qty);
    const unitCost = selectedItem.costPrice;
    const totalAmount = round2(effectiveQty * unitCost);

    setIsSubmitting(true);
    try {
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
      toast.success('Adjustment Recorded', `Stock adjustment ${adj.adjustmentNumber} posted.`);
      setIsModalOpen(false);
      setQuantity('1');
      setReason('');
      setNotes('');
    } catch (err) {
      toast.error('Save Failed', 'Could not record adjustment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeBadge = (adjType: string) => {
    switch (adjType) {
      case 'WASTAGE':
      case 'SPOILAGE':
        return <Badge variant="danger">Wastage / Spoilage</Badge>;
      case 'EXPIRED':
        return <Badge variant="warning">Expired Goods</Badge>;
      case 'BREAKAGE':
        return <Badge variant="warning">Breakage / Damage</Badge>;
      case 'PHYSICAL_COUNT_SURPLUS':
        return <Badge variant="success">+ Count Surplus</Badge>;
      case 'PHYSICAL_COUNT_DEFICIT':
        return <Badge variant="danger">- Count Deficit</Badge>;
      default:
        return <Badge variant="default">{adjType}</Badge>;
    }
  };

  return (
    <PageContainer
      title="Stock Adjustments & Wastage"
      subtitle="Audit and account for spoilage, kitchen breakage, shelf expiry, and physical stock count variance"
      actions={
        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
          <Icons.Plus size={16} />
          <span>Record Adjustment / Wastage</span>
        </Button>
      }
    >
      {/* Table or EmptyState */}
      {stockAdjustments.length === 0 ? (
        <EmptyState
          icon="AlertTriangle"
          title="No stock adjustments recorded"
          description="Log spoiled kitchen ingredients, breakage, or physical stock count adjustments."
          action={
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              <Icons.Plus size={16} />
              <span>Record First Adjustment</span>
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Adj #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Adjustment Type</TableHead>
              <TableHead className="text-right">Qty Impact</TableHead>
              <TableHead className="text-right">Unit Rate</TableHead>
              <TableHead className="text-right">Financial Impact</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {stockAdjustments.map((adj) => {
              const it = items.find((i) => i.id === adj.itemId);

              return (
                <TableRow key={adj.id}>
                  <TableCell className="font-bold text-[#172554] font-mono">
                    {adj.adjustmentNumber}
                  </TableCell>
                  <TableCell className="text-[#64748B]">{formatDate(adj.date)}</TableCell>
                  <TableCell className="font-semibold text-[#172554]">
                    {it?.name || 'Item'}
                    <span className="text-[#64748B] font-normal text-[12px] ml-1.5 font-mono">({it?.code})</span>
                  </TableCell>
                  <TableCell>{getTypeBadge(adj.type)}</TableCell>
                  <TableCell className={`text-right font-bold font-mono tabular-nums ${adj.quantity >= 0 ? 'text-[#047857]' : 'text-[#B91C1C]'}`}>
                    {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity} {it?.unit || ''}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-[#64748B]">
                    {formatCurrency(adj.unitCost)}
                  </TableCell>
                  <TableCell className={`text-right font-bold font-mono tabular-nums ${adj.totalAmount >= 0 ? 'text-[#047857]' : 'text-[#B91C1C]'}`}>
                    {formatCurrency(Math.abs(adj.totalAmount))}
                  </TableCell>
                  <TableCell className="text-[#334155] max-w-xs truncate">{adj.reason}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="success">Posted to GL</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Record Adjustment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Stock Adjustment or Spoilage"
        description="Creates an auditable inventory movement and posts balanced General Ledger entries"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAdjustment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                Adjustment Date <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                Adjustment Reason / Type <span className="text-[#B91C1C]">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as StockAdjustment['type'])}
                className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none cursor-pointer"
              >
                <option value="WASTAGE">Kitchen Spoilage / Wastage (Deduct)</option>
                <option value="EXPIRED">Expired Past Best-Before (Deduct)</option>
                <option value="BREAKAGE">Breakage & Damaged Goods (Deduct)</option>
                <option value="PHYSICAL_COUNT_DEFICIT">Physical Count Shortage (Deduct)</option>
                <option value="PHYSICAL_COUNT_SURPLUS">Physical Count Excess (Add Stock)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[14px] font-semibold text-[#1E293B]">
                Inventory Item <span className="text-[#B91C1C]">*</span>
              </label>
              <span className="text-[12px] font-semibold text-[#0F766E] tabular-nums">
                Current Stock: {selectedStock?.availableQty || 0} {selectedItem?.unit || ''}
              </span>
            </div>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none cursor-pointer"
            >
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  [{it.code}] {it.name} ({it.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
              Quantity Affected ({selectedItem?.unit || 'Units'}) <span className="text-[#B91C1C]">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full h-12 px-4 text-[15px] font-mono tabular-nums rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </div>

          <div>
            <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
              Detailed Reason / Incident Description <span className="text-[#B91C1C]">*</span>
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Broken eggs during shelf restocking"
              className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </div>

          <div>
            <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
              Supervisor Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional incident remarks..."
              className="w-full p-3.5 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1F5F9]">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              <Icons.CheckCircle size={16} />
              <span>Record & Post Adjustment</span>
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
