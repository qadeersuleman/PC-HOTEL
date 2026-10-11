'use client';

import React, { useState } from 'react';
import { PageContainer } from '../../components/layout/page-container';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { EmptyState } from '../../components/ui/empty-state';
import { useToast } from '../../components/ui/toast';
import { Icons } from '../../components/ui/icons';
import { useERPStorage } from '../../lib/storage/context';
import { formatCurrency, formatDate, getTodayDateString, round2 } from '../../lib/utils/formatters';
import { SalesEntry, SalesChannel, SalesPaymentMethod } from '../../types/sales';

export default function SalesPage() {
  const { sales, customers, saveSales } = useERPStorage();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [date, setDate] = useState(getTodayDateString());
  const [channel, setChannel] = useState<SalesChannel>('DINE_IN');
  const [grossSales, setGrossSales] = useState('35000');
  const [discount, setDiscount] = useState('500');
  const [paymentMethod, setPaymentMethod] = useState<SalesPaymentMethod>('CASH');
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [notes, setNotes] = useState('Dinner rush collection');

  const netSales = round2(Math.max(0, (parseFloat(grossSales) || 0) - (parseFloat(discount) || 0)));

  const handleCreateSales = async (e: React.FormEvent) => {
    e.preventDefault();
    if (netSales <= 0) {
      toast.error('Validation Error', 'Net sales revenue must be greater than zero.');
      return;
    }

    const selectedCust = customers.find((c) => c.id === customerId);

    const cashAmount = paymentMethod === 'CASH' ? netSales : 0;
    const bankAmount = paymentMethod === 'CARD' || paymentMethod === 'ONLINE' ? netSales : 0;
    const creditAmount = paymentMethod === 'CREDIT' ? netSales : 0;

    const newSale: SalesEntry = {
      id: `sal-${Date.now()}`,
      invoiceNumber: `SAL-2026-00${sales.length + 1}`,
      date,
      channel,
      grossSales: parseFloat(grossSales) || 0,
      discount: parseFloat(discount) || 0,
      netSales,
      tax: 0,
      totalReceivable: netSales,
      paymentMethod,
      customerId: paymentMethod === 'CREDIT' ? customerId : undefined,
      customerName: paymentMethod === 'CREDIT' ? selectedCust?.name : undefined,
      cashAmount,
      bankAmount,
      creditAmount,
      notes,
      isPosted: true,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveSales(newSale);
      toast.success('Sales Entry Recorded', `Revenue ${newSale.invoiceNumber} posted (${formatCurrency(netSales)}).`);
      setIsModalOpen(false);
    } catch {
      toast.error('Error', 'Failed to save sales entry.');
    }
  };

  return (
    <PageContainer
      title="Daily Sales Entry"
      subtitle="Record restaurant revenue by Dine-in, Takeaway parcel counter, Home Delivery, and Banquet events"
      breadcrumbs={[
        { label: 'Revenue' },
        { label: 'Daily Sales' },
      ]}
      actions={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Icons.Plus size={15} />
          <span>Record Daily Sales</span>
        </Button>
      }
    >
      <Card>
        {sales.length === 0 ? (
          <EmptyState
            icon="DollarSign"
            title="No Sales Entries Recorded"
            description="Record your first daily sales report to credit food revenue and debit cash/bank accounts."
            actionLabel="Record Today's Sales"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Bill #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Gross Sales</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Net Revenue</TableHead>
                <TableHead>Settlement</TableHead>
                <TableHead>Account Affected</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {sales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono font-bold text-[#172554] text-[13px]">
                    {s.invoiceNumber}
                  </TableCell>
                  <TableCell className="text-[13px] text-[#64748B] font-mono">{formatDate(s.date)}</TableCell>
                  <TableCell>
                    <Badge variant={s.channel === 'DINE_IN' ? 'success' : s.channel === 'TAKEAWAY' ? 'info' : 'purple'}>
                      {s.channel.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-[13px] tabular-nums text-[#64748B]">
                    {formatCurrency(s.grossSales)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[13px] tabular-nums text-[#B91C1C]">
                    {s.discount > 0 ? `-${formatCurrency(s.discount)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-[14px] tabular-nums text-[#047857]">
                    {formatCurrency(s.netSales)}
                  </TableCell>
                  <TableCell>
                    <span className="text-[13px] font-semibold text-[#334155]">{s.paymentMethod}</span>
                  </TableCell>
                  <TableCell className="text-[13px]">
                    {s.paymentMethod === 'CASH' && <span className="text-[#047857] font-medium">Cash in Hand (100100)</span>}
                    {s.paymentMethod === 'CARD' && <span className="text-[#1D4ED8] font-medium">Meezan Bank (100110)</span>}
                    {s.paymentMethod === 'CREDIT' && (
                      <span className="text-[#C2410C] font-medium">AR: {s.customerName || 'Customer'}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="success">Posted to GL</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Record Sales Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Daily Restaurant Sales"
        description="Records sales revenue. Inflows cash/bank or increases Accounts Receivable without double-counting."
      >
        <form onSubmit={handleCreateSales} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                Date
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
                Sales Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as SalesChannel)}
                className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              >
                <option value="DINE_IN">Dine-in (Restaurant Floor)</option>
                <option value="TAKEAWAY">Takeaway / Parcel Counter</option>
                <option value="DELIVERY">Home Delivery</option>
                <option value="CATERING">Catering / Banquet Event</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                Gross Food Sales (PKR)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={grossSales}
                onChange={(e) => setGrossSales(e.target.value)}
                className="w-full h-11 px-3 text-[14px] font-bold font-mono rounded-xl border border-[#E2E8F0] bg-white text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                Customer Discount (PKR)
              </label>
              <input
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full h-11 px-3 text-[14px] font-mono rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex justify-between items-center text-[13px]">
            <span className="font-semibold text-[#065F46]">Net Sales Revenue (Credited to #400100):</span>
            <span className="font-bold font-mono text-base text-[#047857]">{formatCurrency(netSales)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                Settlement / Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as SalesPaymentMethod)}
                className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              >
                <option value="CASH">Cash in Hand (Counter)</option>
                <option value="CARD">Card POS / Bank Account</option>
                <option value="CREDIT">Customer Credit (On Account)</option>
              </select>
            </div>

            {paymentMethod === 'CREDIT' ? (
              <div>
                <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                  Credit Customer
                </label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.accountNo}] {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                  Register / Reference Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Counter Register #1"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save & Post Revenue
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
