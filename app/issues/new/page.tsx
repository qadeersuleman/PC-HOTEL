'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { formatCurrency, getTodayDateString, round2 } from '../../../lib/utils/formatters';
import { IssueInvoice, IssueLineItem } from '../../../types/issue';
import { validateStockAvailability } from '../../../lib/inventory/stock-movements';

interface FormIssueLine {
  id: string;
  itemId: string;
  issueQuantity: number;
  purpose: string;
}

export default function NewIssueInvoicePage() {
  const router = useRouter();
  const { departments, items, stockStatusList, issues, saveIssue } = useERPStorage();

  const [date, setDate] = useState(getTodayDateString());
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [issueNumber, setInvoiceNumber] = useState(`ISS-2026-00${issues.length + 5}`);
  const [destination, setDestination] = useState('Chef Station 1');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedDept = useMemo(() => departments.find((d) => d.id === departmentId), [departments, departmentId]);

  const [lineItems, setLineItems] = useState<FormIssueLine[]>([
    {
      id: 'ili-init-1',
      itemId: items[0]?.id || '',
      issueQuantity: 1,
      purpose: 'Food Preparation',
    },
  ]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: `ili-${Date.now()}-${lineItems.length + 1}`,
        itemId: items[0]?.id || '',
        issueQuantity: 1,
        purpose: 'Food Preparation',
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleItemSelect = (index: number, selectedItemId: string) => {
    const updated = [...lineItems];
    updated[index].itemId = selectedItemId;
    setLineItems(updated);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const updated = [...lineItems];
    updated[index].issueQuantity = Math.max(0.01, qty);
    setLineItems(updated);
  };

  const handlePurposeChange = (index: number, purpose: string) => {
    const updated = [...lineItems];
    updated[index].purpose = purpose;
    setLineItems(updated);
  };

  // Live total cost calculation
  const totalIssueCost = useMemo(() => {
    return round2(
      lineItems.reduce((sum, li) => {
        const item = items.find((i) => i.id === li.itemId);
        const cost = item?.costPrice || 0;
        return sum + li.issueQuantity * cost;
      }, 0)
    );
  }, [lineItems, items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!departmentId || lineItems.length === 0) return;

    // Validate stock for all lines
    const formattedItems: IssueLineItem[] = [];

    for (const li of lineItems) {
      const item = items.find((i) => i.id === li.itemId)!;
      const stock = stockStatusList.find((s) => s.itemId === li.itemId);
      const availableQty = stock?.availableQty || 0;

      const validation = validateStockAvailability(availableQty, li.issueQuantity, item.name);
      if (!validation.valid) {
        setErrorMessage(validation.error || 'Insufficient stock.');
        return;
      }

      const unitCost = item.costPrice;
      const totalCost = round2(li.issueQuantity * unitCost);

      formattedItems.push({
        id: li.id,
        itemId: li.itemId,
        itemName: item.name,
        itemCode: item.code,
        unit: item.unit,
        availableQuantity: availableQty,
        issueQuantity: round2(li.issueQuantity),
        unitCost,
        totalCost,
        purpose: li.purpose,
      });
    }

    const issueInvoice: IssueInvoice = {
      id: `iss-${Date.now()}`,
      issueNumber,
      date,
      departmentId,
      departmentName: selectedDept?.name || 'Kitchen',
      items: formattedItems,
      totalCost: totalIssueCost,
      destination,
      notes,
      isPosted: true,
      createdAt: new Date().toISOString(),
    };

    await saveIssue(issueInvoice);
    router.push('/issues');
  };

  return (
    <PageContainer
      title="Create Issue Invoice"
      subtitle="Issue store inventory to kitchen counters or operating departments with strict stock validation"
      actions={
        <Link href="/issues">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
            <Icons.AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Invoice Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Issue Metadata & Classification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Issue Number
                </label>
                <input
                  type="text"
                  required
                  value={issueNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono"
                />
              </div>

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
                  Issuing Department
                </label>
                <select
                  required
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.isKitchen ? 'Direct COGS' : 'Operating Expense'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Destination / Station
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Kitchen Range 1"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                />
              </div>
            </div>

            <div className="mt-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 text-xs flex items-center justify-between">
              <span className="text-zinc-500">Accounting Effect:</span>
              {selectedDept?.isKitchen ? (
                <Badge variant="success">
                  Kitchen Consumption $\rightarrow$ Direct COGS (Cost of Goods Sold)
                </Badge>
              ) : (
                <Badge variant="info">
                  Operating Department $\rightarrow$ Operating Expense (Packaging / Supplies)
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Multi-item Issue Lines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Items to Issue</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              <Icons.Plus size={14} />
              <span>Add Item Row</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {lineItems.map((line, index) => {
                const currentItem = items.find((i) => i.id === line.itemId);
                const stock = stockStatusList.find((s) => s.itemId === line.itemId);
                const availableQty = stock?.availableQty || 0;
                const unitCost = currentItem?.costPrice || 0;
                const lineTotal = round2(line.issueQuantity * unitCost);
                const isOverStock = line.issueQuantity > availableQty;

                return (
                  <div
                    key={line.id}
                    className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-xl border ${
                      isOverStock
                        ? 'border-rose-300 bg-rose-50/40 dark:bg-rose-950/20'
                        : 'border-zinc-200/60 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Select Item
                      </label>
                      <select
                        value={line.itemId}
                        onChange={(e) => handleItemSelect(index, e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                      >
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>
                            [{it.code}] {it.name} ({it.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-28 text-center sm:text-left">
                      <span className="block text-[11px] font-medium text-zinc-500 mb-1">In Stock</span>
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block py-1">
                        {availableQty} {currentItem?.unit}
                      </span>
                    </div>

                    <div className="w-full sm:w-28">
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Issue Qty
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={line.issueQuantity}
                        onChange={(e) => handleQtyChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                      />
                    </div>

                    <div className="w-full sm:w-36">
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Purpose
                      </label>
                      <input
                        type="text"
                        value={line.purpose}
                        onChange={(e) => handlePurposeChange(index, e.target.value)}
                        placeholder="e.g. Dinner rush"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                      />
                    </div>

                    <div className="w-full sm:w-32 text-right">
                      <span className="block text-[11px] font-medium text-zinc-500 mb-1">Cost (WAC)</span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block py-1.5">
                        {formatCurrency(lineTotal)}
                      </span>
                    </div>

                    <div className="pt-2 sm:pt-4">
                      <button
                        type="button"
                        disabled={lineItems.length <= 1}
                        onClick={() => removeLineItem(index)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 disabled:opacity-20 cursor-pointer"
                      >
                        <Icons.Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom summary */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between gap-6">
              <div className="flex-1 max-w-md">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Notes / Batch Instructions
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Issued for wedding party menu or daily breakfast prep"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                />
              </div>

              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-base text-zinc-900 dark:text-zinc-100 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span>Total Issue Value:</span>
                  <span className="text-emerald-600">{formatCurrency(totalIssueCost)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/issues">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary">
            Save & Deduct Stock
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
