'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { useToast } from '../../../components/ui/toast';
import { formatCurrency, getTodayDateString, round2 } from '../../../lib/utils/formatters';
import { PurchaseInvoice, PurchaseLineItem, PurchasePaymentType } from '../../../types/purchase';

interface FormLineItem {
  id: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const toast = useToast();
  const { vendors, items, purchases, savePurchase } = useERPStorage();

  const [date, setDate] = useState(getTodayDateString());
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState(`PI-2026-0${purchases.length + 10}`);
  const [paymentType, setPaymentType] = useState<PurchasePaymentType>('CREDIT');
  const [termsDays, setTermsDays] = useState(15);
  const [notes, setNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lineItems, setLineItems] = useState<FormLineItem[]>([
    {
      id: 'pli-init-1',
      itemId: items[0]?.id || '',
      quantity: 1,
      unitPrice: items[0]?.costPrice || 0,
    },
  ]);

  // Synchronize initial vendor when vendors load from storage
  useEffect(() => {
    if (!vendorId && vendors.length > 0) {
      setVendorId(vendors[0].id);
    }
  }, [vendors, vendorId]);

  // Synchronize initial line item when items load from storage
  useEffect(() => {
    if (items.length > 0) {
      setLineItems((prev) => {
        if (prev.length === 1 && !prev[0].itemId) {
          return [
            {
              ...prev[0],
              itemId: items[0].id,
              unitPrice: items[0].costPrice || 0,
            },
          ];
        }
        return prev;
      });
    }
  }, [items]);

  // Selected vendor
  const selectedVendor = useMemo(() => vendors.find((v) => v.id === vendorId), [vendors, vendorId]);

  // Compute dueDate from terms
  const dueDate = useMemo(() => {
    const d = new Date(date);
    d.setDate(d.getDate() + (paymentType === 'CASH' ? 0 : termsDays));
    return d.toISOString().split('T')[0];
  }, [date, paymentType, termsDays]);

  // Line item helpers
  const handleItemSelect = (index: number, selectedItemId: string) => {
    const selectedItem = items.find((i) => i.id === selectedItemId);
    const updated = [...lineItems];
    updated[index].itemId = selectedItemId;
    if (selectedItem) {
      updated[index].unitPrice = selectedItem.costPrice || 0;
    }
    setLineItems(updated);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const updated = [...lineItems];
    updated[index].quantity = Math.max(0.01, qty);
    setLineItems(updated);
  };

  const handlePriceChange = (index: number, price: number) => {
    const updated = [...lineItems];
    updated[index].unitPrice = Math.max(0, price);
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: `pli-${Date.now()}-${lineItems.length + 1}`,
        itemId: items[0]?.id || '',
        quantity: 1,
        unitPrice: items[0]?.costPrice || 0,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = useMemo(() => {
    return round2(lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  }, [lineItems]);

  const netTotal = subtotal;

  const effectivePaidAmount = useMemo(() => {
    if (paymentType === 'CASH') return netTotal;
    const val = parseFloat(paidAmount) || 0;
    return Math.min(netTotal, Math.max(0, val));
  }, [paymentType, netTotal, paidAmount]);

  const balanceAmount = round2(netTotal - effectivePaidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (vendors.length === 0) {
      toast.error('No Vendors Found', 'Please register at least one vendor in the Vendors module before creating a bill.');
      return;
    }

    const effectiveVendorId = vendorId || vendors[0]?.id;
    if (!effectiveVendorId) {
      toast.error('Validation Error', 'Please select a vendor.');
      return;
    }

    if (items.length === 0) {
      toast.error('No Items in Catalog', 'Please add items in Inventory > Items before creating a purchase bill.');
      return;
    }

    // Auto-resolve any empty itemId fallback if items exist
    const preparedLines = lineItems.map((li) => {
      if (!li.itemId && items.length > 0) {
        return {
          ...li,
          itemId: items[0].id,
          unitPrice: li.unitPrice > 0 ? li.unitPrice : (items[0].costPrice || 0),
        };
      }
      return li;
    });

    const validLines = preparedLines.filter((li) => li.itemId && li.quantity > 0);
    if (validLines.length === 0) {
      toast.error('Validation Error', 'Please add at least one valid item to the bill with a quantity greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const compiledItems: PurchaseLineItem[] = validLines.map((li) => {
        const itemObj = items.find((it) => it.id === li.itemId)!;
        return {
          id: li.id,
          itemId: li.itemId,
          itemCode: itemObj?.code || '',
          itemName: itemObj?.name || 'Item',
          quantity: li.quantity,
          unit: itemObj?.unit || 'KG',
          unitPrice: li.unitPrice,
          discount: 0,
          tax: 0,
          lineTotal: round2(li.quantity * li.unitPrice),
        };
      });

      const effectiveNetTotal = round2(compiledItems.reduce((s, it) => s + it.lineTotal, 0));
      const actualPaid = paymentType === 'CASH' ? effectiveNetTotal : Math.min(effectiveNetTotal, Math.max(0, parseFloat(paidAmount) || 0));
      const actualBalance = round2(effectiveNetTotal - actualPaid);

      const activeVendor = vendors.find((v) => v.id === effectiveVendorId);

      const newInvoice: PurchaseInvoice = {
        id: `pi-${Date.now()}`,
        invoiceNumber,
        date,
        vendorId: effectiveVendorId,
        vendorName: activeVendor?.name || 'Vendor',
        paymentType,
        paymentTermsDays: paymentType === 'CASH' ? 0 : termsDays,
        dueDate,
        items: compiledItems,
        subtotal: effectiveNetTotal,
        totalDiscount: 0,
        totalTax: 0,
        netTotal: effectiveNetTotal,
        paidAmount: actualPaid,
        balanceAmount: actualBalance,
        paymentStatus: actualBalance === 0 ? 'PAID' : actualPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
        notes,
        isPosted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await savePurchase(newInvoice);
      toast.success('Purchase Invoice Posted', `Invoice ${invoiceNumber} created and stock received.`);
      router.push('/purchases');
    } catch {
      toast.error('Save Failed', 'Could not save purchase invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Create Purchase Invoice"
      subtitle="Record multi-item receiving bills, increment central warehouse stock, and create creditor liabilities"
      breadcrumbs={[
        { label: 'Purchases', href: '/purchases' },
        { label: 'New Invoice' },
      ]}
      actions={
        <Link href="/purchases">
          <Button variant="outline" size="sm">
            <Icons.ArrowDownLeft size={15} />
            <span>Back to Invoices</span>
          </Button>
        </Link>
      }
    >
      {/* Missing Master Data Warning Banners */}
      {vendors.length === 0 && (
        <div className="p-4 rounded-2xl bg-[#FFF7ED] border border-[#FFEDD5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 text-[#C2410C]">
            <Icons.AlertTriangle size={22} className="shrink-0" />
            <div>
              <p className="font-bold text-[14px] text-[#172554]">No Registered Vendors Found</p>
              <p className="text-[13px] text-[#64748B]">You need to register at least one food or grocery supplier before saving bills.</p>
            </div>
          </div>
          <Link href="/vendors">
            <Button variant="primary" size="sm">
              <Icons.Plus size={14} />
              <span>Register Vendor</span>
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
              <p className="text-[13px] text-[#64748B]">You need to define inventory items (meat, spices, dairy) before receiving stock.</p>
            </div>
          </div>
          <Link href="/inventory/items">
            <Button variant="primary" size="sm">
              <Icons.Plus size={14} />
              <span>Add Items to Catalog</span>
            </Button>
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bill Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                  Invoice Number <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full h-11 px-3 text-[14px] font-mono rounded-xl border border-[#E2E8F0] bg-white text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                  Invoice Date <span className="text-[#B91C1C]">*</span>
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
                  Vendor / Supplier <span className="text-[#B91C1C]">*</span>
                </label>
                <select
                  required
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                >
                  {vendors.length === 0 ? (
                    <option value="">No vendors found (Register one first)</option>
                  ) : (
                    vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        [{v.accountNo}] {v.name} • {v.category}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                  Payment Mode <span className="text-[#B91C1C]">*</span>
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as PurchasePaymentType)}
                  className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                >
                  <option value="CREDIT">Credit (Accounts Payable — Settle Later)</option>
                  <option value="CASH">Cash in Hand (Paid Instantly)</option>
                </select>
              </div>

              {paymentType === 'CREDIT' && (
                <>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                      Credit Terms (Days)
                    </label>
                    <input
                      type="number"
                      value={termsDays}
                      onChange={(e) => setTermsDays(parseInt(e.target.value) || 0)}
                      className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                      Due Date (Auto-calculated)
                    </label>
                    <input
                      type="date"
                      disabled
                      value={dueDate}
                      className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Multi-item Line Items Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC]/50 p-5">
            <div>
              <CardTitle className="text-base font-bold text-[#172554]">Bill Line Items</CardTitle>
              <p className="text-[13px] text-[#64748B] mt-0.5">Add grocery items, received quantities, and unit purchase rates</p>
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
                const lineTotal = round2(line.quantity * line.unitPrice);

                return (
                  <div
                    key={line.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] transition-all hover:border-[#CBD5E1]"
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                        Select Item
                      </label>
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
                        Qty ({currentItem?.unit || 'Unit'})
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        value={line.quantity}
                        onChange={(e) => handleQtyChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full h-11 px-3 text-[14px] font-mono tabular-nums rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                      />
                    </div>

                    <div className="w-full sm:w-40">
                      <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                        Rate (PKR)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={line.unitPrice}
                        onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full h-11 px-3 text-[14px] font-mono tabular-nums rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                      />
                    </div>

                    <div className="w-full sm:w-44">
                      <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                        Line Total
                      </label>
                      <div className="h-11 px-3 flex items-center justify-end rounded-xl bg-white border border-[#E2E8F0] font-bold font-mono text-[14px] text-[#172554] tabular-nums">
                        {formatCurrency(lineTotal)}
                      </div>
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

        {/* Accounting Settlement & Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add supplier delivery receipt number, quality notes, or receiving remarks..."
                className="w-full p-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accounting Settlement Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-[14px]">
              <div className="flex justify-between items-center py-2 border-b border-[#E2E8F0]">
                <span className="text-[#64748B]">Total Bill Amount:</span>
                <span className="font-bold font-mono text-lg text-[#172554] tabular-nums">{formatCurrency(netTotal)}</span>
              </div>

              {paymentType === 'CREDIT' ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-[13px] font-semibold text-[#172554]">
                      Paid Upfront (Partial Cash):
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max={netTotal}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-36 h-10 px-3 text-right font-mono tabular-nums rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                    />
                  </div>

                  <div className="flex justify-between items-center py-2 border-t border-[#E2E8F0] bg-[#FFF7ED] p-3 rounded-xl border border-[#FFEDD5]">
                    <span className="font-bold text-[#C2410C]">Payable Liability (Credit):</span>
                    <span className="font-bold font-mono text-lg text-[#C2410C] tabular-nums">{formatCurrency(balanceAmount)}</span>
                  </div>
                </>
              ) : (
                <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex justify-between items-center">
                  <span className="font-semibold text-[#065F46]">Settled via Cash in Hand (#100100):</span>
                  <span className="font-bold font-mono text-[#047857]">{formatCurrency(netTotal)}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="outline" size="md" onClick={() => router.push('/purchases')}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
                  <Icons.ShoppingCart size={15} />
                  <span>Save & Post Invoice</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </PageContainer>
  );
}
