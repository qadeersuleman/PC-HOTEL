'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { calculateAccountGeneralLedger } from '../../../lib/accounting/ledger';
import { formatCurrency, formatDate, getTodayDateString, round2 } from '../../../lib/utils/formatters';
import { Voucher } from '../../../types/voucher';

export default function CashAndBankPage() {
  const { accounts, journalEntries, saveVoucher } = useERPStorage();
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
    if (amountNum <= 0) return;

    const fromAcc = accounts.find((a) => a.code === fromAccountCode)!;
    const toAcc = accounts.find((a) => a.code === toAccountCode)!;

    const voucher: Voucher = {
      id: `v-contra-${Date.now()}`,
      voucherNumber: `CONTRA-${Date.now().toString().slice(-4)}`,
      voucherType: 'JV',
      date: transferDate,
      description: `Internal Transfer: ${fromAcc.name} to ${toAcc.name}`,
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
          description: `Deposit received from ${fromAcc.name}`,
        },
        {
          id: `contra-${Date.now()}-cr`,
          accountId: fromAcc.id,
          accountCode: fromAcc.code,
          accountName: fromAcc.name,
          debit: 0,
          credit: amountNum,
          description: `Transferred to ${toAcc.name}`,
        },
      ],
      isPosted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveVoucher(voucher);
    setIsTransferModalOpen(false);
  };

  return (
    <PageContainer
      title="Cash & Bank Management"
      subtitle="Track physical cash drawer at restaurant counter and Meezan Bank operating balance"
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Cash in Hand (Counter)</span>
            <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Icons.Banknote size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {formatCurrency(cashGL?.closingBalance || 0)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Account Code: 100100</p>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Meezan Bank Operating A/C</span>
            <div className="w-7 h-7 rounded bg-sky-50 text-sky-600 flex items-center justify-center">
              <Icons.Landmark size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {formatCurrency(bankGL?.closingBalance || 0)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Account Code: 100110</p>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Liquid Reserves</span>
            <div className="w-7 h-7 rounded bg-teal-50 text-teal-600 flex items-center justify-center">
              <Icons.DollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(totalLiquidAssets)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Instant available working capital</p>
        </Card>
      </div>

      {/* Cash In Hand Ledger */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cash in Hand Ledger (Account 100100)</CardTitle>
          <span className="text-xs font-bold text-emerald-600">
            Balance: {formatCurrency(cashGL?.closingBalance || 0)}
          </span>
        </CardHeader>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Date</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Ref #</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Inflow (Debit)</TableHead>
              <TableHead className="text-right">Outflow (Credit)</TableHead>
              <TableHead className="text-right">Running Cash</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {!cashGL || cashGL.entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-zinc-400 text-xs">
                  No cash transactions found.
                </td>
              </tr>
            ) : (
              cashGL.entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs font-mono">{formatDate(entry.date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.sourceType}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold">{entry.sourceNumber}</TableCell>
                  <TableCell className="text-xs text-zinc-800 dark:text-zinc-200">{entry.description}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-emerald-600">
                    {entry.debit > 0 ? `+${formatCurrency(entry.debit)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-rose-600">
                    {entry.credit > 0 ? `-${formatCurrency(entry.credit)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-xs">
                    {formatCurrency(entry.balance)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Internal Cash-to-Bank Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Internal Cash & Bank Transfer (Contra)"
        description="Transfer cash counter collections to Meezan Bank, or withdraw operating cash"
      >
        <form onSubmit={handleInternalTransfer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Transfer Date
            </label>
            <input
              type="date"
              required
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                From Account (Source)
              </label>
              <select
                value={fromAccountCode}
                onChange={(e) => setFromAccountCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <option value="100100">100100 — Cash in Hand (Counter)</option>
                <option value="100110">100110 — Meezan Bank Operating A/C</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                To Account (Destination)
              </label>
              <select
                value={toAccountCode}
                onChange={(e) => setToAccountCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <option value="100110">100110 — Meezan Bank Operating A/C</option>
                <option value="100100">100100 — Cash in Hand (Counter)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Transfer Amount (PKR)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Deposit Slip / Cheque Ref
            </label>
            <input
              type="text"
              value={transferRef}
              onChange={(e) => setTransferRef(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
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

