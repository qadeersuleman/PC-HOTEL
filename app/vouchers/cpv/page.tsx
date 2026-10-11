'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { formatCurrency, formatDate, getTodayDateString, round2 } from '../../../lib/utils/formatters';
import { Voucher } from '../../../types/voucher';

function CashPaymentVouchersContent() {
  const searchParams = useSearchParams();
  const initialVendorId = searchParams.get('vendorId');

  const { vouchers, vendors, accounts, purchases, saveVoucher, cancelVoucher } = useERPStorage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [date, setDate] = useState(getTodayDateString());
  const [vendorId, setVendorId] = useState(initialVendorId || vendors[0]?.id || '');
  const [paidFromAccountCode, setPaidFromAccountCode] = useState('100100'); // Cash or Bank
  const [amount, setAmount] = useState('10000');
  const [referenceNo, setReferenceNo] = useState('');
  const [description, setDescription] = useState('Payment to supplier for raw grocery delivery');
  const [allocatedInvoiceId, setAllocatedInvoiceId] = useState<string>('');

  const cpvVouchers = vouchers.filter((v) => v.voucherType === 'CPV');

  // Unpaid invoices for selected vendor
  const vendorInvoices = purchases.filter(
    (p) => p.vendorId === vendorId && p.balanceAmount > 0 && p.isPosted
  );

  const handleCreateCPV = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount) || 0;
    if (numericAmount <= 0) return;

    const selectedVen = vendors.find((v) => v.id === vendorId);
    const paidFromAccount = accounts.find((a) => a.code === paidFromAccountCode)!;
    const apAccount = accounts.find((a) => a.code === '201900')!;

    const voucherNumber = `CPV-2026-00${cpvVouchers.length + 2}`;

    const newVoucher: Voucher = {
      id: `v-cpv-${Date.now()}`,
      voucherNumber,
      voucherType: 'CPV',
      date,
      description: description || `Payment to ${selectedVen?.name || 'Vendor'}`,
      referenceNo,
      amount: round2(numericAmount),
      partyId: vendorId,
      partyType: 'VENDOR',
      paymentMethod: paidFromAccountCode === '100100' ? 'CASH' : 'BANK',
      bankAccountId: paidFromAccount.id,
      allocatedInvoiceId: allocatedInvoiceId || undefined,
      lines: [
        {
          id: `jl-${Date.now()}-dr`,
          accountId: apAccount.id,
          accountCode: apAccount.code,
          accountName: apAccount.name,
          debit: round2(numericAmount),
          credit: 0,
          partyId: vendorId,
          partyType: 'VENDOR',
          description: `Disbursement to ${selectedVen?.name}`,
        },
        {
          id: `jl-${Date.now()}-cr`,
          accountId: paidFromAccount.id,
          accountCode: paidFromAccount.code,
          accountName: paidFromAccount.name,
          debit: 0,
          credit: round2(numericAmount),
          description: `Paid via ${paidFromAccount.name}`,
        },
      ],
      isPosted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveVoucher(newVoucher);
    setIsModalOpen(false);
    setAmount('');
    setReferenceNo('');
    setAllocatedInvoiceId('');
  };

  return (
    <PageContainer
      title="CPV — Cash Payment Vouchers"
      subtitle="Disburse payments to food suppliers, utility providers, and reduce Accounts Payable"
      actions={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Icons.Plus size={14} />
          <span>New Payment Voucher (CPV)</span>
        </Button>
      }
    >
      <Card>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Voucher #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vendor / Payee</TableHead>
              <TableHead>Paid From</TableHead>
              <TableHead>Cheque / Ref #</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount (PKR)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {cpvVouchers.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-zinc-400 text-xs">
                  No payment vouchers recorded.
                </td>
              </tr>
            ) : (
              cpvVouchers.map((v) => {
                const ven = vendors.find((item) => item.id === v.partyId);
                const creditLine = v.lines.find((l) => l.credit > 0);

                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {v.voucherNumber}
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(v.date)}</TableCell>
                    <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {ven?.name || 'Vendor'}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline">{creditLine?.accountName || 'Cash'}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-zinc-500">{v.referenceNo || '—'}</TableCell>
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-300 max-w-[200px] truncate">
                      {v.description}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(v.amount)}
                    </TableCell>
                    <TableCell>
                      {v.isPosted ? <Badge variant="success">Posted to GL</Badge> : <Badge variant="outline">Cancelled</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {v.isPosted && (
                        <button
                          onClick={() => {
                            if (confirm(`Cancel ${v.voucherNumber}? This will restore the vendor liability and refund the payment back to cash/bank.`)) {
                              cancelVoucher(v.id);
                            }
                          }}
                          className="text-xs text-rose-600 hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add CPV Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Cash Payment Voucher (CPV)"
        description="Records outgoing disbursement. Clears Accounts Payable (or creates a Vendor Advance if overpaid) without creating a duplicate expense on P&L."
      >
        <form onSubmit={handleCreateCPV} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Payment Date
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
                Paid From Account
              </label>
              <select
                value={paidFromAccountCode}
                onChange={(e) => setPaidFromAccountCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <option value="100100">100100 — Cash in Hand (Counter)</option>
                <option value="100110">100110 — Meezan Bank Operating A/C</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Pay To Vendor / Creditor
            </label>
            <select
              required
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  [{v.accountNo}] {v.name}
                </option>
              ))}
            </select>
          </div>

          {vendorInvoices.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Allocate to Specific Invoice (Optional)
              </label>
              <select
                value={allocatedInvoiceId}
                onChange={(e) => {
                  setAllocatedInvoiceId(e.target.value);
                  const inv = purchases.find((p) => p.id === e.target.value);
                  if (inv) setAmount(inv.balanceAmount.toString());
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <option value="">-- General Account Settle (No specific bill) --</option>
                {vendorInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} (Balance: {formatCurrency(inv.balanceAmount)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Disbursement Amount (PKR)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Cheque / Transfer Reference
              </label>
              <input
                type="text"
                placeholder="e.g. CHQ-44912 or Bank Ref"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Description / Notes
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Payment for fresh meat deliveries"
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save & Post Payment
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

export default function CashPaymentVouchersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-400">Loading Cash Payment Vouchers...</div>}>
      <CashPaymentVouchersContent />
    </Suspense>
  );
}

