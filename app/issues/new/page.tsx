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
import { useToast } from '../../../components/ui/toast';
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
  const toast = useToast();
  const { departments, items, stockStatusList, issues, saveIssue } = useERPStorage();

  const [date, setDate] = useState(getTodayDateString());
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [issueNumber, setInvoiceNumber] = useState(`ISS-2026-00${issues.length + 5}`);
  const [destination, setDestination] = useState('Chef Station 1');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const item = items.find((i) => i.id === li.itemId);
      if (!item) continue;
      const stock = stockStatusList.find((s) => s.itemId === li.itemId);
      const availableQty = stock?.availableQty || 0;

      const validation = validateStockAvailability(availableQty, li.issueQuantity, item.name);
      if (!validation.valid) {
        setErrorMessage(validation.error || 'Insufficient stock.');
        toast.error('Stock Validation', validation.error || 'Insufficient stock.');
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
        issueQuantity: li.issueQuantity,
        unitCost: unitCost,
        totalCost: totalCost,
        purpose: li.purpose,
      });
    }

    setIsSubmitting(true);
    try {
      const newIssue: IssueInvoice = {
        id: `iss-${Date.now()}`,
        issueNumber,
        date,
        departmentId,
        departmentName: selectedDept?.name || 'Department',
        destination,
        items: formattedItems,
        totalCost: totalIssueCost,
        notes,
        isPosted: true,
        createdAt: new Date().toISOString(),
      };

      await saveIssue(newIssue);
      toast.success('Issue Voucher Posted', `Voucher ${issueNumber} deducted from inventory.`);
      router.push('/issues');
    } catch (err) {
      toast.error('Save Failed', 'Could not save issue invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Create Store Issue Voucher"
      subtitle="Issue kitchen ingredients, meat, beverages, or packing boxes to operational stations"
      breadcrumbs={[
        { label: 'Issue Invoices', href: '/issues' },
        { label: 'New Issue' },
      ]}
      actions={
        <Link href="/issues">
          <Button variant="outline" size="md">
            Cancel
          </Button>
        </Link>
      }
    >
      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-[14px] flex items-center gap-2.5 font-medium">
          <Icons.AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Details */}
        <Card>
          <CardHeader>
            <CardTitle>Voucher Department & Routing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <div>
                <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                  Issue Voucher # <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={issueNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full h-12 px-4 text-[15px] font-mono rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                  Issue Date <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                  Receiving Department <span className="text-[#B91C1C]">*</span>
                </label>
                <select
                  required
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none cursor-pointer"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.isKitchen ? '(Direct COGS)' : '(Operating Supply)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                  Destination Counter / Station
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Karahi Station, BBQ Grill"
                  className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issued Line Items Editor */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Issued Inventory Items</CardTitle>
              <p className="text-[13px] text-[#64748B] mt-0.5">Quantities are validated against available warehouse stock</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              <Icons.Plus size={15} />
              <span>Add Issue Item</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {lineItems.map((line, index) => {
                const currentItem = items.find((i) => i.id === line.itemId);
                const currentStock = stockStatusList.find((s) => s.itemId === line.itemId);
                const available = currentStock?.availableQty || 0;
                const unitCost = currentItem?.costPrice || 0;
                const lineTotal = round2(line.issueQuantity * unitCost);

                return (
                  <div
                    key={line.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] transition-all hover:border-[#CBD5E1]"
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[12px] font-bold text-[#64748B] uppercase">
                          Item to Issue
                        </label>
                        <span className="text-[12px] font-semibold text-[#0F766E] tabular-nums">
                          In Stock: {available} {currentItem?.unit || ''}
                        </span>
                      </div>
                      <select
                        value={line.itemId}
                        onChange={(e) => handleItemSelect(index, e.target.value)}
                        className="w-full h-11 px-3.5 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none cursor-pointer"
                      >
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>
                            [{it.code}] {it.name} ({it.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-36">
                      <label className="block text-[12px] font-bold text-[#64748B] uppercase mb-1">
                        Issue Qty ({currentItem?.unit || ''})
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        max={available}
                        value={line.issueQuantity}
                        onChange={(e) => handleQtyChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full h-11 px-3.5 text-[14px] font-mono tabular-nums rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
                      />
                    </div>

                    <div className="w-full sm:w-44">
                      <label className="block text-[12px] font-bold text-[#64748B] uppercase mb-1">
                        Valuation (Rate)
                      </label>
                      <div className="h-11 px-3.5 flex items-center justify-between rounded-xl bg-white border border-[#E2E8F0] font-mono text-[13px] text-[#64748B] tabular-nums">
                        <span>@{formatCurrency(unitCost)}</span>
                        <span className="font-bold text-[#172554]">{formatCurrency(lineTotal)}</span>
                      </div>
                    </div>

                    <div className="w-full sm:w-44">
                      <label className="block text-[12px] font-bold text-[#64748B] uppercase mb-1">
                        Purpose / Note
                      </label>
                      <input
                        type="text"
                        value={line.purpose}
                        onChange={(e) => handlePurposeChange(index, e.target.value)}
                        placeholder="e.g. Lunch buffet"
                        className="w-full h-11 px-3.5 text-[13px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
                      />
                    </div>

                    <div className="sm:pt-5">
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        disabled={lineItems.length <= 1}
                        className="h-11 w-11 flex items-center justify-center rounded-xl text-[#B91C1C] hover:bg-[#FEF2F2] border border-transparent hover:border-[#FECACA] disabled:opacity-30 disabled:pointer-events-none transition-all"
                        title="Remove row"
                      >
                        <Icons.Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Footer Summary & Post */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Voucher Memo / Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional requisition remarks or chef instructions..."
                  className="w-full p-4 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none transition-all"
                />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-[#0F766E]/30 shadow-md">
              <CardHeader className="bg-[#F0FDFA] border-b border-[#CCFBF1]">
                <CardTitle className="text-[#0F766E]">Consumption Valuation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="flex justify-between items-center text-[14px]">
                  <span className="text-[#64748B]">Station Type:</span>
                  <Badge variant={selectedDept?.isKitchen ? 'success' : 'info'}>
                    {selectedDept?.isKitchen ? 'Direct Kitchen COGS' : 'Station Operating Expense'}
                  </Badge>
                </div>

                <div className="flex justify-between items-center text-[15px] pt-3 border-t border-[#F1F5F9]">
                  <span className="font-bold text-[#172554]">Total Issued Cost:</span>
                  <span className="font-bold text-xl text-[#0F766E] font-mono tabular-nums">
                    {formatCurrency(totalIssueCost)}
                  </span>
                </div>

                <div className="pt-4 border-t border-[#F1F5F9]">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    isLoading={isSubmitting}
                  >
                    <Icons.CheckCircle size={18} />
                    <span>Post & Deduct Inventory</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </PageContainer>
  );
}
