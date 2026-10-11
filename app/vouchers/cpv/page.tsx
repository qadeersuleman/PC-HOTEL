'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageContainer } from '../../../components/layout/page-container';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { EmptyState } from '../../../components/ui/empty-state';
import { useToast } from '../../../components/ui/toast';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { formatCurrency, formatDate, getTodayDateString, round2 } from '../../../lib/utils/formatters';
import { Voucher } from '../../../types/voucher';

function CashPaymentVouchersContent() {
  const searchParams = useSearchParams();
  const initialVendorId = searchParams.get('vendorId');

  const { vouchers, vendors, accounts, purchases, saveVoucher, cancelVoucher } = useERPStorage();
  const toast = useToast();
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
    if (numericAmount <= 0) {
      toast.error('Validation Error', 'Payment amount must be greater than zero.');
      return;
    }

    const selectedVen = vendors.find((v) => v.id === vendorId);
    const paidFromAccount = accounts.find((a) => a.code === paidFromAccountCode)!;
    const apAccount = accounts.find((a) => a.code === '201900')!;

    const voucherNumber = `CPV-2026-00${cpvVouchers.length + 1}`;

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

    try {
      await saveVoucher(newVoucher);
      toast.success('CPV Posted', `Payment ${voucherNumber} recorded. AP reduced and cash disbursed.`);
      setIsModalOpen(false);
      setAmount('');
      setReferenceNo('');
      setAllocatedInvoiceId('');
    } catch {
      toast.error('Error', 'Failed to save cash payment voucher.');
    }
  };

  const handleCancelVoucher = async (v: Voucher) => {
    if (confirm(`Cancel ${v.voucherNumber}? This will restore the vendor liability and refund the payment back to cash/bank.`)) {
      try {
        await cancelVoucher(v.id);
        toast.warning('CPV Cancelled', `${v.voucherNumber} has been reversed.`);
      } catch {
        toast.error('Error', 'Failed to cancel voucher.');
      }
    }
  };

  return (
    <PageContainer
      title="CPV — Cash Payment Vouchers"
      subtitle="Disburse payments to food suppliers, utility providers, and reduce Accounts Payable"
      breadcrumbs={[
        { label: 'Vouchers & GL', href: '/accounts/general-ledger' },
        { label: 'Cash Payment Vouchers (CPV)' },
      ]}
      actions={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Icons.Plus size={15} />
          <span>New Payment Voucher (CPV)</span>
        </Button>
      }
    >
      <Card>
        {cpvVouchers.length === 0 ? (
          <EmptyState
            icon="ArrowUpRight"
            title="No Payment Vouchers Recorded"
            description="Clear supplier bills or record operational prepayments by issuing a Cash Payment Voucher."
            actionLabel="Record First CPV"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Voucher #</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Vendor / Payee</TableHead>
                <TableHead>Paid From</TableHead>
                <TableHead>Cheque / Reference</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount (PKR)</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {cpvVouchers.map((v) => {
                const ven = vendors.find((item) => item.id === v.partyId);
                const creditLine = v.lines.find((l) => l.credit > 0);

                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-bold text-[#172554] text-[13px]">
                      {v.voucherNumber}
                    </TableCell>
                    <TableCell className="text-[13px] text-[#64748B] font-mono">{formatDate(v.date)}</TableCell>
                    <TableCell className="font-semibold text-[#172554] text-[14px]">
                      {ven?.name || 'Vendor'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{creditLine?.accountName || 'Cash'}</Badge>
                    </TableCell>
                    <TableCell className="text-[13px] font-mono text-[#64748B]">{v.referenceNo || '—'}</TableCell>
                    <TableCell className="text-[13px] text-[#334155] max-w-[220px] truncate">
                      {v.description}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-[#C2410C] text-[14px] tabular-nums">
                      {formatCurrency(v.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      {v.isPosted ? (
                        <Badge variant="success">Posted to GL</Badge>
                      ) : (
                        <Badge variant="error">Cancelled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {v.isPosted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelVoucher(v)}
                          className="text-[#B91C1C] hover:text-[#991B1B] hover:bg-[#FEF2F2]"
                        >
                          <Icons.Trash size={13} />
                          <span>Reverse</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
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
              <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                Payment Date
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
                Paid From Account
              </label>
              <select
                value={paidFromAccountCode}
                onChange={(e) => setPaidFromAccountCode(e.target.value)}
                className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              >
                <option value="100100">100100 — Cash in Hand (Counter)</option>
                <option value="100110">100110 — Meezan Bank Operating A/C</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
              Pay To Vendor / Creditor
            </label>
            <select
              required
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            >
              {vendors.length === 0 ? (
                <option value="">No vendors found</option>
              ) : (
                vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    [{v.accountNo}] {v.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {vendorInvoices.length > 0 && (
            <div>
              <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                Allocate to Specific Invoice (Optional)
              </label>
              <select
                value={allocatedInvoiceId}
                onChange={(e) => {
                  setAllocatedInvoiceId(e.target.value);
                  const inv = purchases.find((p) => p.id === e.target.value);
                  if (inv) setAmount(inv.balanceAmount.toString());
                }}
                className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              >
                <option value="">-- General Account Settlement (No specific bill) --</option>
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
              <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                Disbursement Amount (PKR)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-11 px-3 text-[14px] font-bold font-mono rounded-xl border border-[#E2E8F0] bg-white text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                Cheque / Transfer Reference
              </label>
              <input
                type="text"
                placeholder="e.g. CHQ-44912 or Bank Ref"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
              Description / Notes
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Payment for fresh meat deliveries"
              className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save & Post CPV
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

export default function CashPaymentVouchersPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[14px] text-[#64748B]">Loading Cash Payment Vouchers...</div>}>
      <CashPaymentVouchersContent />
    </Suspense>
  );
}
