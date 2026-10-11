'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
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
  const { vendors, items, purchases, savePurchase } = useERPStorage();

  const [date, setDate] = useState(getTodayDateString());
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState(`PI-2026-0${purchases.length + 10}`);
  const [paymentType, setPaymentType] = useState<PurchasePaymentType>('CREDIT');
  const [termsDays, setTermsDays] = useState(15);
  const [notes, setNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');

  const [lineItems, setLineItems] = useState<FormLineItem[]>([
    {
      id: 'pli-init-1',
      itemId: items[0]?.id || '',
      quantity: 1,
      unitPrice: items[0]?.costPrice || 0,
    },
  ]);

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
      updated[index].unitPrice = selectedItem.costPrice;
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
    return Math.min(netTotal, parseFloat(paidAmount) || 0);
  }, [paymentType, netTotal, paidAmount]);

  const balanceAmount = round2(netTotal - effectivePaidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || lineItems.length === 0) return;

    const formattedItems: PurchaseLineItem[] = lineItems.map((li) => {
      const item = items.find((i) => i.id === li.itemId)!;
      return {
        id: li.id,
        itemId: li.itemId,
        itemName: item.name,
        itemCode: item.code,
        unit: item.unit,
        quantity: round2(li.quantity),
        unitPrice: round2(li.unitPrice),
        discount: 0,
        tax: 0,
        lineTotal: round2(li.quantity * li.unitPrice),
      };
    });

    const invoice: PurchaseInvoice = {
      id: `pi-${Date.now()}`,
      invoiceNumber,
      date,
      vendorId,
      vendorName: selectedVendor?.name || 'Vendor',
      paymentType,
      paymentTermsDays: paymentType === 'CASH' ? 0 : termsDays,
      dueDate,
      items: formattedItems,
      subtotal,
      totalDiscount: 0,
      totalTax: 0,
      netTotal,
      paidAmount: effectivePaidAmount,
      balanceAmount,
      paymentStatus: balanceAmount === 0 ? 'PAID' : effectivePaidAmount > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
      notes,
      isPosted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await savePurchase(invoice);
    router.push('/purchases');
  };

  return (
    <PageContainer
      title="Create Purchase Invoice"
      subtitle="Procure inventory items, increase store stock and generate vendor liability entries"
      actions={
        <Link href="/purchases">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Invoice Date
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
                  Select Vendor / Supplier
                </label>
                <select
                  required
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.accountNo} — {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as PurchasePaymentType)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                >
                  <option value="CREDIT">Credit (Accounts Payable)</option>
                  <option value="CASH">Cash in Hand (Paid Instantly)</option>
                </select>
              </div>

              {paymentType === 'CREDIT' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Terms (Days)
                    </label>
                    <input
                      type="number"
                      value={termsDays}
                      onChange={(e) => setTermsDays(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      disabled
                      value={dueDate}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500"
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Multi-item Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Purchase Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              <Icons.Plus size={14} />
              <span>Add Item Row</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {lineItems.map((line, index) => {
                const currentItem = items.find((i) => i.id === line.itemId);
                const lineTotal = round2(line.quantity * line.unitPrice);

                return (
                  <div
                    key={line.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800"
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">Item</label>
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

                    <div className="w-full sm:w-28">
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Quantity ({currentItem?.unit || ''})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={line.quantity}
                        onChange={(e) => handleQtyChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                      />
                    </div>

                    <div className="w-full sm:w-36">
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Unit Price (PKR)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                      />
                    </div>

                    <div className="w-full sm:w-36 text-right">
                      <span className="block text-[11px] font-medium text-zinc-500 mb-1">Total (PKR)</span>
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

            {/* Invoice Financial Summary */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between gap-6">
              <div className="flex-1 max-w-md">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Notes & Terms
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Delivery received at Rohri main branch, weighed on scale"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                />
              </div>

              <div className="w-full sm:w-72 space-y-2.5 text-xs">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-zinc-900 dark:text-zinc-100 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span>Net Total:</span>
                  <span className="text-emerald-600">{formatCurrency(netTotal)}</span>
                </div>

                {paymentType === 'CREDIT' && (
                  <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Paid Down / Advance:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        className="w-28 px-2 py-1 text-right text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                      />
                    </div>
                    <div className="flex justify-between font-semibold text-amber-600">
                      <span>Accounts Payable Balance:</span>
                      <span>{formatCurrency(balanceAmount)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/purchases">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary">
            Save & Post Purchase Invoice
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
