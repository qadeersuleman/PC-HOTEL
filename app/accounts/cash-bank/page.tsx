'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { EmptyState } from '../../../components/ui/empty-state';
import { useToast } from '../../../components/ui/toast';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { calculateAccountGeneralLedger } from '../../../lib/accounting/ledger';
import { formatCurrency, formatDate, getTodayDateString, round2 } from '../../../lib/utils/formatters';
import { Voucher } from '../../../types/voucher';

export default function CashAndBankPage() {
  const { accounts, journalEntries, saveVoucher } = useERPStorage();
  const toast = useToast();
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Transfer form
  const [transferDate, setTransferDate] = useState(getTodayDateString());
  const [fromAccountCode, setFromAccountCode] = useState('100100'); // Cash to Bank
  const [toAccountCode, setToAccountCode] = useState('100110');
  const [transferAmount, setTransferAmount] = useState('20000');
  const [transferRef, setTransferRef] = useState('Bank Deposit Slip #8812');

  const cashAccount = useMemo(() => accounts.find((a) => a.code === '100100')!, [accounts]);
  const bankAccount = useMemo(() => accounts.find((a) => a.code === '100110')!, [accounts]);

  const cashGL = useMemo(() => {
    return cashAccount ? calculateAccountGeneralLedger(cashAccount, journalEntries) : null;
  }, [cashAccount, journalEntries]);

  const bankGL = useMemo(() => {
    return bankAccount ? calculateAccountGeneralLedger(bankAccount, journalEntries) : null;
  }, [bankAccount, journalEntries]);

  const totalLiquidAssets = (cashGL?.closingBalance || 0) + (bankGL?.closingBalance || 0);

  const handleInternalTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(transferAmount) || 0;
    if (amountNum <= 0) {
      toast.error('Validation Error', 'Transfer amount must be greater than zero.');
      return;
    }

    const fromAcc = accounts.find((a) => a.code === fromAccountCode)!;
    const toAcc = accounts.find((a) => a.code === toAccountCode)!;

    const voucher: Voucher = {
      id: `v-contra-${Date.now()}`,
      voucherNumber: `CONTRA-${Date.now().toString().slice(-4)}`,
      voucherType: 'JV',
      date: transferDate,
      description: `Internal Contra Transfer: ${fromAcc?.name} to ${toAcc?.name}`,
      referenceNo: transferRef,
      amount: amountNum,
      lines: [
        {
          id: `contra-${Date.now()}-dr`,
          accountId: toAcc.id,
          accountCode: toAcc.code,
          accountName: toAcc.name,
          debit: amountNum,
          credit: 0,
          description: `Deposit received from ${fromAcc?.name}`,
        },
        {
          id: `contra-${Date.now()}-cr`,
          accountId: fromAcc.id,
          accountCode: fromAcc.code,
          accountName: fromAcc.name,
          debit: 0,
          credit: amountNum,
          description: `Transferred to ${toAcc?.name}`,
        },
      ],
      isPosted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveVoucher(voucher);
      toast.success('Transfer Recorded', `Transferred ${formatCurrency(amountNum)} from ${fromAcc?.name} to ${toAcc?.name}.`);
      setIsTransferModalOpen(false);
    } catch {
      toast.error('Error', 'Failed to record contra transfer.');
    }
  };

  return (
    <PageContainer
      title="Cash & Bank Management"
      subtitle="Track physical cash counter drawers and Meezan Bank operating accounts"
      breadcrumbs={[
        { label: 'Financial Accounts', href: '/accounts/chart-of-accounts' },
        { label: 'Cash & Bank' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsTransferModalOpen(true)}>
            <Icons.RefreshCw size={14} />
            <span>Transfer / Deposit Cash</span>
          </Button>
          <Link href="/vouchers/crv">
            <Button variant="primary" size="sm">
              <Icons.Plus size={14} />
              <span>Record Receipt (CRV)</span>
            </Button>
          </Link>
        </div>
      }
    >
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[12px] text-[#64748B] uppercase tracking-wider font-semibold">
              Cash in Hand (Counter)
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] text-[#047857] flex items-center justify-center">
              <Icons.Banknote size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-bold font-mono tabular-nums text-[#172554]">
              {formatCurrency(cashGL?.closingBalance || 0)}
            </p>
            <p className="text-[12px] text-[#64748B] mt-1 font-mono">GL Account: #100100</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[12px] text-[#64748B] uppercase tracking-wider font-semibold">
              Meezan Bank Operating A/C
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center">
              <Icons.Landmark size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-bold font-mono tabular-nums text-[#172554]">
              {formatCurrency(bankGL?.closingBalance || 0)}
            </p>
            <p className="text-[12px] text-[#64748B] mt-1 font-mono">GL Account: #100110</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[12px] text-[#64748B] uppercase tracking-wider font-semibold">
              Total Liquid Reserves
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
              <Icons.DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-bold font-mono tabular-nums text-[#0F766E]">
              {formatCurrency(totalLiquidAssets)}
            </p>
            <p className="text-[12px] text-[#64748B] mt-1">Available instant working capital</p>
          </div>
        </div>
      </div>

      {/* Cash In Hand Ledger */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC]/50 p-5">
          <div>
            <CardTitle className="text-base font-bold text-[#172554]">Cash in Hand Ledger (Account #100100)</CardTitle>
            <p className="text-[13px] text-[#64748B] mt-0.5">Physical cash drawer transactions and counter receipts</p>
          </div>
          <div className="text-right">
            <span className="text-[12px] text-[#64748B] block">Current Balance</span>
            <span className="text-lg font-bold font-mono text-[#047857]">
              {formatCurrency(cashGL?.closingBalance || 0)}
            </span>
          </div>
        </CardHeader>
        {!cashGL || cashGL.entries.length === 0 ? (
          <EmptyState
            icon="Banknote"
            title="No Cash Transactions"
            description="Cash transactions will appear as daily sales, customer receipts, and expense disbursements are recorded."
            actionLabel="Record Cash Receipt"
            actionHref="/vouchers/crv"
          />
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Date</TableHead>
                <TableHead>Source Type</TableHead>
                <TableHead>Reference #</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Inflow (Debit)</TableHead>
                <TableHead className="text-right">Outflow (Credit)</TableHead>
                <TableHead className="text-right">Running Cash Balance</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {cashGL.entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-[13px] font-mono text-[#64748B]">{formatDate(entry.date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.sourceType}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[13px] font-semibold text-[#0F766E]">{entry.sourceNumber}</TableCell>
                  <TableCell className="text-[13px] text-[#334155]">{entry.description}</TableCell>
                  <TableCell className="text-right font-mono text-[13px] tabular-nums font-semibold text-[#047857]">
                    {entry.debit > 0 ? `+${formatCurrency(entry.debit)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[13px] tabular-nums font-semibold text-[#B91C1C]">
                    {entry.credit > 0 ? `-${formatCurrency(entry.credit)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-[13px] tabular-nums text-[#172554]">
                    {formatCurrency(entry.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Internal Cash-to-Bank Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Internal Cash & Bank Transfer (Contra)"
        description="Deposit restaurant cash drawer collections into Meezan Bank, or withdraw operational cash."
      >
        <form onSubmit={handleInternalTransfer} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
              Transfer Date
            </label>
            <input
              type="date"
              required
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                From Account (Source)
              </label>
              <select
                value={fromAccountCode}
                onChange={(e) => setFromAccountCode(e.target.value)}
                className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              >
                <option value="100100">100100 — Cash in Hand (Counter)</option>
                <option value="100110">100110 — Meezan Bank Operating A/C</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                To Account (Destination)
              </label>
              <select
                value={toAccountCode}
                onChange={(e) => setToAccountCode(e.target.value)}
                className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              >
                <option value="100110">100110 — Meezan Bank Operating A/C</option>
                <option value="100100">100100 — Cash in Hand (Counter)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
              Transfer Amount (PKR)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-full h-11 px-3 text-[14px] font-bold font-mono rounded-xl border border-[#E2E8F0] bg-white text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
              Deposit Slip / Cheque Ref
            </label>
            <input
              type="text"
              value={transferRef}
              onChange={(e) => setTransferRef(e.target.value)}
              placeholder="e.g. Deposit Slip #7729"
              className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
