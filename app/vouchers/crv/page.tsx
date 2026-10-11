'use client';

import React, { useState } from 'react';
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

export default function CashReceiptVouchersPage() {
  const { vouchers, customers, accounts, saveVoucher, cancelVoucher } = useERPStorage();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [date, setDate] = useState(getTodayDateString());
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [depositAccountCode, setDepositAccountCode] = useState('100100'); // Cash or Bank
  const [amount, setAmount] = useState('5000');
  const [referenceNo, setReferenceNo] = useState('');
  const [description, setDescription] = useState('Collection from customer against outstanding dining tab');

  const crvVouchers = vouchers.filter((v) => v.voucherType === 'CRV');

  const handleCreateCRV = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount) || 0;
    if (numericAmount <= 0) {
      toast.error('Validation Error', 'Receipt amount must be greater than zero.');
      return;
    }

    const selectedCust = customers.find((c) => c.id === customerId);
    const depositAccount = accounts.find((a) => a.code === depositAccountCode)!;
    const arAccount = accounts.find((a) => a.code === '100500')!;

    const voucherNumber = `CRV-2026-00${crvVouchers.length + 1}`;

    const newVoucher: Voucher = {
      id: `v-crv-${Date.now()}`,
      voucherNumber,
      voucherType: 'CRV',
      date,
      description: description || `Receipt from ${selectedCust?.name || 'Customer'}`,
      referenceNo,
      amount: round2(numericAmount),
      partyId: customerId,
      partyType: 'CUSTOMER',
      paymentMethod: depositAccountCode === '100100' ? 'CASH' : 'BANK',
      lines: [
        {
          id: `jl-${Date.now()}-dr`,
          accountId: depositAccount.id,
          accountCode: depositAccount.code,
          accountName: depositAccount.name,
          debit: round2(numericAmount),
          credit: 0,
          description: `Received in ${depositAccount.name}`,
        },
        {
          id: `jl-${Date.now()}-cr`,
          accountId: arAccount.id,
          accountCode: arAccount.code,
          accountName: arAccount.name,
          debit: 0,
          credit: round2(numericAmount),
          partyId: customerId,
          partyType: 'CUSTOMER',
          description: `Credit settlement for ${selectedCust?.name}`,
        },
      ],
      isPosted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveVoucher(newVoucher);
      toast.success('CRV Posted', `Receipt ${voucherNumber} recorded. Cash increased and receivable reduced.`);
      setIsModalOpen(false);
      setAmount('');
      setReferenceNo('');
    } catch {
      toast.error('Error', 'Failed to save cash receipt voucher.');
    }
  };

  const handleCancelVoucher = async (v: Voucher) => {
    if (confirm(`Cancel ${v.voucherNumber}? This will reverse the cash intake and restore the customer receivable balance.`)) {
      try {
        await cancelVoucher(v.id);
        toast.warning('CRV Cancelled', `${v.voucherNumber} has been reversed.`);
      } catch {
        toast.error('Error', 'Failed to cancel voucher.');
      }
    }
  };

  return (
    <PageContainer
      title="CRV — Cash Receipt Vouchers"
      subtitle="Record incoming cash and bank receipts from dining customers, banquets, and event advances"
      breadcrumbs={[
        { label: 'Vouchers & GL', href: '/accounts/general-ledger' },
        { label: 'Cash Receipt Vouchers (CRV)' },
      ]}
      actions={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Icons.Plus size={15} />
          <span>New Receipt Voucher (CRV)</span>
        </Button>
      }
    >
      <Card>
        {crvVouchers.length === 0 ? (
          <EmptyState
            icon="ArrowDownLeft"
            title="No Receipt Vouchers Recorded"
            description="Collect customer dining tabs or banquet deposits by recording a new Cash Receipt Voucher."
            actionLabel="Record First CRV"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Voucher #</TableHead>
                <TableHead>Receipt Date</TableHead>
                <TableHead>Customer / Payee</TableHead>
                <TableHead>Account Deposited</TableHead>
                <TableHead>Reference / Cheque</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount (PKR)</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {crvVouchers.map((v) => {
                const cust = customers.find((c) => c.id === v.partyId);
                const debitLine = v.lines.find((l) => l.debit > 0);

                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-bold text-[#172554] text-[13px]">
                      {v.voucherNumber}
                    </TableCell>
                    <TableCell className="text-[13px] text-[#64748B] font-mono">{formatDate(v.date)}</TableCell>
                    <TableCell className="font-semibold text-[#172554] text-[14px]">
                      {cust?.name || 'Walk-in Customer'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{debitLine?.accountName || 'Cash in Hand'}</Badge>
                    </TableCell>
                    <TableCell className="text-[13px] font-mono text-[#64748B]">{v.referenceNo || '—'}</TableCell>
                    <TableCell className="text-[13px] text-[#334155] max-w-[220px] truncate">
                      {v.description}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-[#047857] text-[14px] tabular-nums">
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

      {/* Add CRV Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Cash Receipt Voucher (CRV)"
        description="Records incoming cash/bank receipt. Strictly reduces Accounts Receivable and increases Cash/Bank without creating duplicate sales revenue."
      >
        <form onSubmit={handleCreateCRV} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                Receipt Date
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
                Deposit Into
              </label>
              <select
                value={depositAccountCode}
                onChange={(e) => setDepositAccountCode(e.target.value)}
                className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              >
                <option value="100100">100100 — Cash in Hand (Counter)</option>
                <option value="100110">100110 — Meezan Bank Operating A/C</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
              Received From Customer
            </label>
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            >
              {customers.length === 0 ? (
                <option value="">No customers found</option>
              ) : (
                customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.accountNo}] {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                Amount Received (PKR)
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
                Receipt / Cheque / Online Ref
              </label>
              <input
                type="text"
                placeholder="e.g. REC-102 or Online TXN"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
              Description / Narration
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Cleared dining tab for Banquet event"
              className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save & Post CRV
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
