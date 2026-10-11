'use client';

import React, { useState } from 'react';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Modal } from '../../../components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { formatCurrency, formatDate } from '../../../lib/utils/formatters';
import { ItemStockStatus, StockMovement } from '../../../types/inventory';

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
      title="Current Stock with Amount"
      subtitle="GT Road Cafe Taj — Real-time inventory valuation based on Weighted Average Cost (WAC)"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Icons.Printer size={14} />
            <span>Print Report</span>
          </Button>
        </div>
      }
    >
      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Stock Items</span>
          <p className="text-xl font-bold mt-1">{stockStatusList.length} SKUs</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Inventory Valuation</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(totalStockValuation)}
          </p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Low Stock Warnings</span>
          <p className={`text-xl font-bold mt-1 ${lowStockItemsCount > 0 ? 'text-rose-600' : 'text-zinc-700'}`}>
            {lowStockItemsCount} Items
          </p>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                placeholder="Search by item code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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

      {/* Stock Report Table matching the user's report format */}
      <Card>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Item ID</TableHead>
              <TableHead>Category Name</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Available Qty</TableHead>
              <TableHead className="text-right">Avg Price (PKR)</TableHead>
              <TableHead className="text-right">Stock Value (PKR)</TableHead>
              <TableHead>Min Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Audit Trail</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredStock.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-10 text-center text-zinc-400 text-xs">
                  No inventory items match search filter.
                </td>
              </tr>
            ) : (
              filteredStock.map((item) => (
                <TableRow key={item.itemId}>
                  <TableCell className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {item.itemCode}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      {item.categoryName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.itemName}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{item.unit}</TableCell>
                  <TableCell className="text-right font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                    {item.availableQty.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-zinc-700 dark:text-zinc-300">
                    {formatCurrency(item.averageCost)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(item.stockValue)}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">
                    {item.minStockLevel} {item.unit}
                  </TableCell>
                  <TableCell>
                    {item.isLowStock ? (
                      <Badge variant="danger">Low Stock</Badge>
                    ) : (
                      <Badge variant="success">Sufficient</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => setSelectedItemHistory(item)}
                      className="p-1 rounded text-zinc-500 hover:text-emerald-600"
                      title="View Movement History"
                    >
                      <Icons.Clock size={16} />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Totals Row */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-between items-center text-xs font-bold">
          <span>Grand Totals:</span>
          <span className="text-emerald-600 dark:text-emerald-400 text-sm">
            {formatCurrency(totalStockValuation)}
          </span>
        </div>
      </Card>

      {/* Movement History Audit Modal */}
      {selectedItemHistory && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedItemHistory(null)}
          title={`Stock Movements: ${selectedItemHistory.itemName}`}
          description={`Complete auditable timeline of purchases, issues, wastage and adjustments for Item #${selectedItemHistory.itemCode}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-xs">
              <div>
                <span className="text-zinc-400 block">Available Qty</span>
                <span className="font-bold text-emerald-600">{selectedItemHistory.availableQty} {selectedItemHistory.unit}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Purchased Qty</span>
                <span className="font-bold">{selectedItemHistory.purchasedQty + selectedItemHistory.openingQty}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Issued Qty</span>
                <span className="font-bold text-amber-600">{selectedItemHistory.issuedQty}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Current WAC Cost</span>
                <span className="font-bold">{formatCurrency(selectedItemHistory.averageCost)}</span>
              </div>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total Cost</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {itemMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-zinc-400 text-xs">
                        No movement records found.
                      </td>
                    </tr>
                  ) : (
                    itemMovements.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell className="text-xs">{formatDate(mov.date)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              mov.movementType === 'PURCHASE'
                                ? 'success'
                                : mov.movementType === 'ISSUE'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {mov.movementType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{mov.referenceNumber}</TableCell>
                        <TableCell className="font-mono text-xs font-bold">{mov.quantity}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(mov.unitCost)}</TableCell>
                        <TableCell className="text-xs font-semibold">{formatCurrency(mov.totalCost)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedItemHistory(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}

