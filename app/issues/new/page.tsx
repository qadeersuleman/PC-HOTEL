'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { useToast } from '../../../components/ui/toast';
import { validateStockAvailability } from '../../../lib/inventory/stock-movements';
import { formatCurrency, getTodayDateString, round2 } from '../../../lib/utils/formatters';
import { IssueInvoice, IssueLineItem } from '../../../types/issue';

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

  const [lineItems, setLineItems] = useState<FormIssueLine[]>([
    {
      id: 'ili-init-1',
      itemId: items[0]?.id || '',
      issueQuantity: 1,
      purpose: 'Food Preparation',
    },
  ]);

  // Synchronize department when departments load
  useEffect(() => {
    if (!departmentId && departments.length > 0) {
      setDepartmentId(departments[0].id);
    }
  }, [departments, departmentId]);

  // Synchronize initial line item when items load
  useEffect(() => {
    if (items.length > 0) {
      setLineItems((prev) => {
        if (prev.length === 1 && !prev[0].itemId) {
          return [
            {
              ...prev[0],
              itemId: items[0].id,
            },
          ];
        }
        return prev;
      });
    }
  }, [items]);

  const selectedDept = useMemo(() => departments.find((d) => d.id === departmentId), [departments, departmentId]);

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

    if (departments.length === 0) {
      toast.error('No Departments', 'Please create at least one department first.');
      return;
    }

    const effectiveDeptId = departmentId || departments[0]?.id;
    if (!effectiveDeptId) {
      toast.error('Validation Error', 'Please select a receiving department.');
      return;
    }

    if (items.length === 0) {
      toast.error('No Items in Catalog', 'Please create items in catalog first.');
      return;
    }

    // Auto-resolve any empty itemId fallback if items exist
    const preparedLines = lineItems.map((li) => {
      if (!li.itemId && items.length > 0) {
        return {
          ...li,
          itemId: items[0].id,
        };
      }
      return li;
    });

    const validLines = preparedLines.filter((li) => li.itemId && li.issueQuantity > 0);
    if (validLines.length === 0) {
      toast.error('Validation Error', 'Please select an item and valid issue quantity.');
      return;
    }

    // Validate stock for all lines
    const formattedItems: IssueLineItem[] = [];

    for (const li of validLines) {
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

      const unitCost = item.costPrice || 0;
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
      const activeDept = departments.find((d) => d.id === effectiveDeptId);
      const effectiveTotalCost = round2(formattedItems.reduce((s, it) => s + it.totalCost, 0));

      const newIssue: IssueInvoice = {
        id: `iss-${Date.now()}`,
        issueNumber,
        date,
        departmentId: effectiveDeptId,
        departmentName: activeDept?.name || 'Department',
        destination,
        items: formattedItems,
        totalCost: effectiveTotalCost,
        notes,
        isPosted: true,
        createdAt: new Date().toISOString(),
      };

      await saveIssue(newIssue);
      toast.success('Store Issue Dispatched', `Voucher ${issueNumber} posted. Central stock reduced.`);
      router.push('/issues');
    } catch {
      toast.error('Save Failed', 'Could not record store issue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Create Store Issue Invoice"
      subtitle="Dispatch raw stock from Central Store to Kitchen, BBQ, Packing, or Housekeeping stations"
      breadcrumbs={[
        { label: 'Store Issues', href: '/issues' },
        { label: 'New Issue' },
      ]}
      actions={
        <Link href="/issues">
          <Button variant="outline" size="sm">
            <Icons.ArrowDownLeft size={15} />
            <span>Back to Issue Invoices</span>
          </Button>
        </Link>
      }
    >
      {/* Warning Banners if Master Data is missing */}
      {departments.length === 0 && (
        <div className="p-4 rounded-2xl bg-[#FFF7ED] border border-[#FFEDD5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 text-[#C2410C]">
            <Icons.AlertTriangle size={22} className="shrink-0" />
            <div>
              <p className="font-bold text-[14px] text-[#172554]">No Departments Configured</p>
              <p className="text-[13px] text-[#64748B]">You need to register at least one operational station (Kitchen, Housekeeping, Store).</p>
            </div>
          </div>
          <Link href="/departments">
            <Button variant="primary" size="sm">
              <Icons.Plus size={14} />
              <span>Create Department</span>
            </Button>
          </Link>
        </div>
      )}

      {items.length === 0 && (
        <div className="p-4 rounded-2xl bg-[#FFF7ED] border border-[#FFEDD5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 text-[#C2410C]">
            <Icons.AlertTriangle size={22} className="shrink-0" />
            <div>
              <p className="font-bold text-[14px] text-[#172554]">No Items in Catalog</p>
              <p className="text-[13px] text-[#64748B]">Define items and receive stock before issuing to kitchen stations.</p>
            </div>
          </div>
          <Link href="/inventory/items">
            <Button variant="primary" size="sm">
              <Icons.Plus size={14} />
              <span>Catalog Items</span>
            </Button>
          </Link>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-3 text-[#B91C1C] text-[14px] font-semibold">
          <Icons.AlertTriangle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Issue Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Issue Metadata & Destination</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                  Issue Slip # <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={issueNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full h-11 px-3 text-[14px] font-mono rounded-xl border border-[#E2E8F0] bg-white text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                  Issue Date <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                  Issuing Department <span className="text-[#B91C1C]">*</span>
                </label>
                <select
                  required
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                >
                  {departments.length === 0 ? (
                    <option value="">No departments found</option>
                  ) : (
                    departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} {dept.isKitchen ? '(Direct COGS)' : '(Operating Expense)'}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                  Station / Chef Counter
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Main Cooking Range"
                  className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>
            </div>

            {selectedDept && (
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3 text-[13px]">
                <Badge variant={selectedDept.isKitchen ? 'primary' : 'outline'}>
                  {selectedDept.isKitchen ? 'Culinary Kitchen Station' : 'Operational Non-Kitchen'}
                </Badge>
                <span className="text-[#64748B]">
                  {selectedDept.isKitchen
                    ? 'Transfers directly contribute to Estimated Cost of Goods Sold (COGS) on P&L.'
                    : 'Classified strictly as departmental operating/cleaning supply expense without inflating COGS.'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Multi-item Issue Lines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC]/50 p-5">
            <div>
              <CardTitle className="text-base font-bold text-[#172554]">Items to Issue from Warehouse</CardTitle>
              <p className="text-[13px] text-[#64748B] mt-0.5">Select stock items and quantities to debit station inventory</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              <Icons.Plus size={15} />
              <span>Add Item Row</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-3">
              {lineItems.map((line, index) => {
                const currentItem = items.find((i) => i.id === line.itemId);
                const stock = stockStatusList.find((s) => s.itemId === line.itemId);
                const available = stock?.availableQty || 0;
                const unitCost = currentItem?.costPrice || 0;
                const lineTotal = round2(line.issueQuantity * unitCost);

                return (
                  <div
                    key={line.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] transition-all hover:border-[#CBD5E1]"
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                          Item to Issue
                        </label>
                        <span className="text-[12px] font-semibold text-[#0F766E] tabular-nums">
                          In Stock: {available} {currentItem?.unit || ''}
                        </span>
                      </div>
                      <select
                        value={line.itemId}
                        onChange={(e) => handleItemSelect(index, e.target.value)}
                        className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                      >
                        {items.length === 0 ? (
                          <option value="">No items defined in catalog</option>
                        ) : (
                          <>
                            {!line.itemId && <option value="">-- Choose Item --</option>}
                            {items.map((it) => (
                              <option key={it.id} value={it.id}>
                                [{it.code}] {it.name} ({it.unit})
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>

                    <div className="w-full sm:w-36">
                      <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                        Issue Qty ({currentItem?.unit || ''})
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        max={available > 0 ? available : undefined}
                        value={line.issueQuantity}
                        onChange={(e) => handleQtyChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full h-11 px-3 text-[14px] font-mono tabular-nums rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                      />
                    </div>

                    <div className="w-full sm:w-44">
                      <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                        Valuation (Rate)
                      </label>
                      <div className="h-11 px-3 flex items-center justify-between rounded-xl bg-white border border-[#E2E8F0] font-mono text-[13px] text-[#64748B] tabular-nums">
                        <span>@{formatCurrency(unitCost)}</span>
                        <span className="font-bold text-[#172554]">{formatCurrency(lineTotal)}</span>
                      </div>
                    </div>

                    <div className="w-full sm:w-44">
                      <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                        Purpose / Note
                      </label>
                      <input
                        type="text"
                        value={line.purpose}
                        onChange={(e) => handlePurposeChange(index, e.target.value)}
                        placeholder="e.g. Lunch buffet"
                        className="w-full h-11 px-3 text-[13px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
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

        {/* Footer Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Remarks about shift requisition, kitchen requisition order number..."
                className="w-full p-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Requisition Cost</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-[#E2E8F0]">
                <span className="text-[#64748B]">Total Dispatched Cost:</span>
                <span className="font-bold font-mono text-xl text-[#0F766E] tabular-nums">{formatCurrency(totalIssueCost)}</span>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="outline" size="md" onClick={() => router.push('/issues')}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
                  <Icons.ArrowUpRight size={15} />
                  <span>Dispatch Store Issue</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </PageContainer>
  );
}
