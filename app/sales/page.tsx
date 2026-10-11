'use client';

import React, { useState } from 'react';
import { PageContainer } from '../../components/layout/page-container';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Icons } from '../../components/ui/icons';
import { useERPStorage } from '../../lib/storage/context';
import { formatCurrency, formatDate, getTodayDateString, round2 } from '../../lib/utils/formatters';
import { SalesEntry, SalesChannel, SalesPaymentMethod } from '../../types/sales';

export default function SalesPage() {
  const { sales, customers, saveSales } = useERPStorage();
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
    if (netSales <= 0) return;

    const selectedCust = customers.find((c) => c.id === customerId);

    const cashAmount = paymentMethod === 'CASH' ? netSales : 0;
    const bankAmount = paymentMethod === 'CARD' || paymentMethod === 'ONLINE' ? netSales : 0;
    const creditAmount = paymentMethod === 'CREDIT' ? netSales : 0;

    const newSale: SalesEntry = {
      id: `sal-${Date.now()}`,
      invoiceNumber: `SAL-2026-00${sales.length + 3}`,
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

    await saveSales(newSale);
    setIsModalOpen(false);
  };

  return (
    <PageContainer
      title="Daily Sales Entry"
      subtitle="Record restaurant revenue by Dine-in, Takeaway, Delivery, and Banquet events"
      actions={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Icons.Plus size={14} />
          <span>Record Daily Sales</span>
        </Button>
      }
    >
      <Card>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Bill #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead className="text-right">Gross Sales</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Net Revenue</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Account Affected</TableHead>
              <TableHead>Status</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-zinc-400 text-xs">
                  No sales entries recorded.
                </td>
              </tr>
            ) : (
              sales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {s.invoiceNumber}
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(s.date)}</TableCell>
                  <TableCell>
                    <Badge variant={s.channel === 'DINE_IN' ? 'success' : s.channel === 'TAKEAWAY' ? 'info' : 'purple'}>
                      {s.channel.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-zinc-500">
                    {formatCurrency(s.grossSales)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-rose-500">
                    {s.discount > 0 ? `-${formatCurrency(s.discount)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(s.netSales)}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold">{s.paymentMethod}</span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {s.paymentMethod === 'CASH' && <span className="text-zinc-600">Cash in Hand (100100)</span>}
                    {s.paymentMethod === 'CARD' && <span className="text-zinc-600">Meezan Bank (100110)</span>}
                    {s.paymentMethod === 'CREDIT' && (
                      <span className="text-blue-600 font-medium">AR: {s.customerName || 'Customer'}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">Posted to GL</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
                Sales Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as SalesChannel)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
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
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Gross Food Sales (PKR)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={grossSales}
                onChange={(e) => setGrossSales(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Customer Discount (PKR)
              </label>
              <input
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex justify-between items-center text-xs">
            <span className="font-semibold text-emerald-800 dark:text-emerald-300">Net Sales Revenue:</span>
            <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400">{formatCurrency(netSales)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Settlement / Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as SalesPaymentMethod)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <option value="CASH">Cash in Hand (Counter)</option>
                <option value="CARD">Card POS / Bank Account</option>
                <option value="CREDIT">Customer Credit (On Account)</option>
              </select>
            </div>

            {paymentMethod === 'CREDIT' ? (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Credit Customer
                </label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
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
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Cash Register / Register Ref
                </label>
                <input
                  type="text"
                  placeholder="e.g. Counter Register #1"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
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

