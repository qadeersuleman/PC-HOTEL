'use client';

import React, { useState, useMemo } from 'react';
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
    const val = parseFloat(paidAmount) || 0;
    return Math.min(netTotal, Math.max(0, val));
  }, [paymentType, netTotal, paidAmount]);

  const balanceAmount = round2(netTotal - effectivePaidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      toast.error('Validation Error', 'Please select a vendor or register one first.');
      return;
    }
    if (lineItems.length === 0 || !lineItems[0].itemId) {
      toast.error('Validation Error', 'Please add at least one valid line item to the bill.');
      return;
    }

    setIsSubmitting(true);
    try {
      const compiledItems: PurchaseLineItem[] = lineItems.map((li) => {
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

      const newInvoice: PurchaseInvoice = {
        id: `pi-${Date.now()}`,
        invoiceNumber,
        date,
        vendorId,
        vendorName: selectedVendor?.name || 'Vendor',
        paymentType,
        paymentTermsDays: paymentType === 'CASH' ? 0 : termsDays,
        dueDate,
        items: compiledItems,
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

      await savePurchase(newInvoice);
      toast.success('Purchase Invoice Posted', `Invoice ${invoiceNumber} created and stock received.`);
      router.push('/purchases');
    } catch (err) {
      toast.error('Save Failed', 'Could not save purchase invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Create Purchase Invoice"
      subtitle="Procure raw materials, fresh produce, and kitchen supplies with automated stock intake"
      breadcrumbs={[
        { label: 'Purchase Invoices', href: '/purchases' },
        { label: 'New Invoice' },
      ]}
      actions={
        <Link href="/purchases">
          <Button variant="outline" size="md">
            Cancel
          </Button>
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Header Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice General Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <div>
                <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                  Invoice Number <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full h-12 px-4 text-[15px] font-mono rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                  Invoice Date <span className="text-[#B91C1C]">*</span>
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
                  Vendor / Supplier <span className="text-[#B91C1C]">*</span>
                </label>
                <select
                  required
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none transition-all cursor-pointer"
                >
                  {vendors.length === 0 ? (
                    <option value="">No registered vendors (Create one first)</option>
                  ) : (
                    vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        [{v.accountNo}] {v.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                  Payment Mode <span className="text-[#B91C1C]">*</span>
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as PurchasePaymentType)}
                  className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none transition-all cursor-pointer"
                >
                  <option value="CREDIT">Credit (Accounts Payable - Settle Later)</option>
                  <option value="CASH">Cash in Hand (Paid Instantly)</option>
                </select>
              </div>

              {paymentType === 'CREDIT' && (
                <>
                  <div>
                    <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                      Credit Terms (Days)
                    </label>
                    <input
                      type="number"
                      value={termsDays}
                      onChange={(e) => setTermsDays(parseInt(e.target.value) || 0)}
                      className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                      Due Date (Auto-calculated)
                    </label>
                    <input
                      type="date"
                      disabled
                      value={dueDate}
                      className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Multi-item Line Items Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Bill Line Items</CardTitle>
              <p className="text-[13px] text-[#64748B] mt-0.5">Add grocery items, quantities, and negotiated unit rates</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              <Icons.Plus size={15} />
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
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] transition-all hover:border-[#CBD5E1]"
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <label className="block text-[12px] font-bold text-[#64748B] uppercase mb-1">
                        Select Item
                      </label>
                      <select
                        value={line.itemId}
                        onChange={(e) => handleItemSelect(index, e.target.value)}
                        className="w-full h-11 px-3.5 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none cursor-pointer"
                      >
                        {items.length === 0 ? (
                          <option value="">No items defined in catalog</option>
                        ) : (
                          items.map((it) => (
                            <option key={it.id} value={it.id}>
                              [{it.code}] {it.name} ({it.unit})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="w-full sm:w-36">
                      <label className="block text-[12px] font-bold text-[#64748B] uppercase mb-1">
                        Qty ({currentItem?.unit || 'Unit'})
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        value={line.quantity}
                        onChange={(e) => handleQtyChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full h-11 px-3.5 text-[14px] font-mono tabular-nums rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
                      />
                    </div>

                    <div className="w-full sm:w-40">
                      <label className="block text-[12px] font-bold text-[#64748B] uppercase mb-1">
                        Rate (PKR)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={line.unitPrice}
                        onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full h-11 px-3.5 text-[14px] font-mono tabular-nums rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
                      />
                    </div>

                    <div className="w-full sm:w-44">
                      <label className="block text-[12px] font-bold text-[#64748B] uppercase mb-1">
                        Line Total
                      </label>
                      <div className="h-11 px-3.5 flex items-center justify-end rounded-xl bg-white border border-[#E2E8F0] font-bold font-mono text-[14px] text-[#172554] tabular-nums">
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

        {/* Invoice Summary and Submit */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Notes & Remarks</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional delivery notes, driver contact, or invoice memo..."
                  className="w-full p-4 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none transition-all"
                />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-[#0F766E]/30 shadow-md">
              <CardHeader className="bg-[#F0FDFA] border-b border-[#CCFBF1]">
                <CardTitle className="text-[#0F766E]">Settlement Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="flex justify-between items-center text-[14px]">
                  <span className="text-[#64748B]">Gross Subtotal:</span>
                  <span className="font-bold text-[#172554] font-mono tabular-nums">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between items-center text-[15px] pt-3 border-t border-[#F1F5F9]">
                  <span className="font-bold text-[#172554]">Invoice Grand Total:</span>
                  <span className="font-bold text-xl text-[#0F766E] font-mono tabular-nums">{formatCurrency(netTotal)}</span>
                </div>

                {paymentType === 'CREDIT' ? (
                  <div className="pt-3 border-t border-[#F1F5F9] space-y-3">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#1E293B] mb-1.5">
                        Immediate Advance / Partial Paid
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={netTotal}
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        className="w-full h-11 px-3.5 text-[14px] font-mono tabular-nums rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
                      />
                    </div>
                    <div className="flex justify-between items-center text-[14px] pt-2">
                      <span className="text-[#64748B] font-semibold">Net Balance Due (AP):</span>
                      <span className="font-bold text-[#C2410C] font-mono tabular-nums">{formatCurrency(balanceAmount)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[13px] text-[#047857] flex items-center gap-2">
                    <Icons.CheckCircle size={16} />
                    <span>Settled immediately via Cash in Hand.</span>
                  </div>
                )}

                <div className="pt-4 border-t border-[#F1F5F9]">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    isLoading={isSubmitting}
                  >
                    <Icons.CheckCircle size={18} />
                    <span>Post & Receive Inventory</span>
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
