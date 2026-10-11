'use client';

import React, { useState } from 'react';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Modal } from '../../../components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { EmptyState } from '../../../components/ui/empty-state';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { formatCurrency, formatDate } from '../../../lib/utils/formatters';
import { ItemStockStatus } from '../../../types/inventory';

export default function CurrentStockPage() {
  const { stockStatusList, totalStockValuation, stockMovements, lowStockItemsCount } = useERPStorage();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedItemHistory, setSelectedItemHistory] = useState<ItemStockStatus | null>(null);

  const categories = Array.from(new Set(stockStatusList.map((s) => s.categoryName)));

  const filteredStock = stockStatusList.filter((item) => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(search.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || item.categoryName === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const itemMovements = selectedItemHistory
    ? stockMovements.filter((m) => m.itemId === selectedItemHistory.itemId)
    : [];

  return (
    <PageContainer
      title="Current Stock & Valuation"
      subtitle="Real-time restaurant grocery and ingredients inventory based on Weighted Average Cost (WAC)"
      actions={
        <Button variant="outline" size="md" onClick={() => window.print()}>
          <Icons.Printer size={16} />
          <span>Print Inventory Report</span>
        </Button>
      }
    >
      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#64748B] uppercase tracking-wider font-bold">Catalog Items</span>
            <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] border border-[#E0F2FE] flex items-center justify-center text-[#0284C7] shadow-2xs">
              <Icons.Layers size={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#172554] mt-2 font-mono tabular-nums">{stockStatusList.length} SKUs</p>
          <p className="text-[12px] text-[#64748B] mt-1">Active inventory master records</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#64748B] uppercase tracking-wider font-bold">Total Stock Valuation</span>
            <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center text-[#0F766E] shadow-2xs">
              <Icons.Boxes size={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#0F766E] mt-2 font-mono tabular-nums">
            {formatCurrency(totalStockValuation)}
          </p>
          <p className="text-[12px] text-[#64748B] mt-1">Weighted average asset value</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#64748B] uppercase tracking-wider font-bold">Low Stock Warnings</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-2xs ${
              lowStockItemsCount > 0 ? 'bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C]' : 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857]'
            }`}>
              <Icons.AlertTriangle size={20} />
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold mt-2 font-mono tabular-nums ${
            lowStockItemsCount > 0 ? 'text-[#B91C1C]' : 'text-[#047857]'
          }`}>
            {lowStockItemsCount} Items
          </p>
          <p className="text-[12px] text-[#64748B] mt-1">Below minimum safety levels</p>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
              <input
                type="text"
                placeholder="Search by item code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <span className="text-[13px] font-semibold text-[#64748B] whitespace-nowrap">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-11 px-3.5 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table or EmptyState */}
      {filteredStock.length === 0 ? (
        <EmptyState
          icon="Boxes"
          title="No inventory stock found"
          description="Create purchase bills or stock adjustments to populate store stock."
        />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Code</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Available Qty</TableHead>
              <TableHead className="text-right">Average Unit Cost</TableHead>
              <TableHead className="text-right">Total Valuation</TableHead>
              <TableHead className="text-right">Min Stock</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Stock Ledger</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredStock.map((item) => (
              <TableRow key={item.itemId}>
                <TableCell className="font-mono font-bold text-[#172554]">{item.itemCode}</TableCell>
                <TableCell className="font-semibold text-[#172554]">{item.itemName}</TableCell>
                <TableCell className="text-[#64748B]">{item.categoryName}</TableCell>
                <TableCell className="text-right font-bold text-[#172554] font-mono tabular-nums">
                  {item.availableQty} <span className="text-[12px] font-normal text-[#64748B]">{item.unit}</span>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-[#64748B]">
                  {formatCurrency(item.averageCost)}
                </TableCell>
                <TableCell className="text-right font-bold font-mono tabular-nums text-[#0F766E]">
                  {formatCurrency(item.stockValue)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-[#64748B]">
                  {item.minStockLevel} {item.unit}
                </TableCell>
                <TableCell className="text-center">
                  {item.availableQty <= 0 ? (
                    <Badge variant="danger">Out of Stock</Badge>
                  ) : item.isLowStock ? (
                    <Badge variant="warning">Low Stock</Badge>
                  ) : (
                    <Badge variant="success">Healthy</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedItemHistory(item)}
                  >
                    <Icons.Clock size={14} />
                    <span>Audit Trail</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Movement Audit Modal */}
      {selectedItemHistory && (
        <Modal
          isOpen={Boolean(selectedItemHistory)}
          onClose={() => setSelectedItemHistory(null)}
          title={`Stock Movement Ledger — ${selectedItemHistory.itemName}`}
          description={`[${selectedItemHistory.itemCode}] ${selectedItemHistory.categoryName} • Unit: ${selectedItemHistory.unit}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[13px]">
              <div>
                <span className="text-[#64748B] block text-[11px] font-bold uppercase tracking-wider">Available Qty</span>
                <span className="font-bold text-lg text-[#172554] font-mono mt-0.5 block">
                  {selectedItemHistory.availableQty} {selectedItemHistory.unit}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px] font-bold uppercase tracking-wider">Average Cost (WAC)</span>
                <span className="font-bold text-lg text-[#0F766E] font-mono mt-0.5 block">
                  {formatCurrency(selectedItemHistory.averageCost)}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px] font-bold uppercase tracking-wider">Total Value</span>
                <span className="font-bold text-lg text-[#172554] font-mono mt-0.5 block">
                  {formatCurrency(selectedItemHistory.stockValue)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-[13px] font-bold text-[#64748B] uppercase tracking-wider mb-2.5">Chronological Audit Trail</h4>
              {itemMovements.length === 0 ? (
                <p className="text-[13px] text-[#64748B] py-6 text-center">No movement transactions recorded for this item.</p>
              ) : (
                <div className="rounded-xl border border-[#E2E8F0] overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase sticky top-0">
                      <tr>
                        <th className="px-3.5 py-2.5">Date</th>
                        <th className="px-3.5 py-2.5">Type</th>
                        <th className="px-3.5 py-2.5">Ref #</th>
                        <th className="px-3.5 py-2.5 text-right">Qty</th>
                        <th className="px-3.5 py-2.5 text-right">Unit Rate</th>
                        <th className="px-3.5 py-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {itemMovements.map((m) => {
                        const isIncrease = m.movementType === 'PURCHASE' || m.movementType === 'ADJUSTMENT_ADD' || m.movementType === 'RETURN_FROM_DEPT';

                        return (
                          <tr key={m.id} className="hover:bg-[#F8FAFC]">
                            <td className="px-3.5 py-2.5 text-[#64748B]">{formatDate(m.date)}</td>
                            <td className="px-3.5 py-2.5">
                              <Badge variant={isIncrease ? 'success' : 'danger'} size="sm">
                                {m.movementType}
                              </Badge>
                            </td>
                            <td className="px-3.5 py-2.5 font-mono text-[12px]">{m.referenceNumber}</td>
                            <td className={`px-3.5 py-2.5 text-right font-bold font-mono tabular-nums ${isIncrease ? 'text-[#047857]' : 'text-[#B91C1C]'}`}>
                              {isIncrease ? `+${m.quantity}` : `-${m.quantity}`}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono tabular-nums text-[#64748B]">{formatCurrency(m.unitCost)}</td>
                            <td className="px-3.5 py-2.5 text-right font-bold font-mono tabular-nums text-[#172554]">{formatCurrency(m.totalCost)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#F1F5F9]">
              <Button variant="secondary" size="sm" onClick={() => setSelectedItemHistory(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
