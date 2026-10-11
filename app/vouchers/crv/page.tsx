'use client';

import React, { useState } from 'react';
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

export default function CashReceiptVouchersPage() {
  const { vouchers, customers, accounts, saveVoucher, cancelVoucher } = useERPStorage();
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
    if (numericAmount <= 0) return;

    const selectedCust = customers.find((c) => c.id === customerId);
    const depositAccount = accounts.find((a) => a.code === depositAccountCode)!;
    const arAccount = accounts.find((a) => a.code === '100500')!;

    const voucherNumber = `CRV-2026-00${crvVouchers.length + 2}`;

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

    await saveVoucher(newVoucher);
    setIsModalOpen(false);
    setAmount('');
    setReferenceNo('');
  };

  return (
    <PageContainer
      title="CRV — Cash Receipt Vouchers"
      subtitle="Record cash and bank receipts from customers, banquet advances, and dining collections"
      actions={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Icons.Plus size={14} />
          <span>New Receipt Voucher (CRV)</span>
        </Button>
      }
    >
      <Card>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Voucher #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer / Party</TableHead>
              <TableHead>Account Received In</TableHead>
              <TableHead>Ref / Cheque #</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount (PKR)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {crvVouchers.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-zinc-400 text-xs">
                  No receipt vouchers recorded.
                </td>
              </tr>
            ) : (
              crvVouchers.map((v) => {
                const cust = customers.find((c) => c.id === v.partyId);
                const debitLine = v.lines.find((l) => l.debit > 0);

                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {v.voucherNumber}
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(v.date)}</TableCell>
                    <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {cust?.name || 'Customer'}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline">{debitLine?.accountName || 'Cash in Hand'}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-zinc-500">{v.referenceNo || '—'}</TableCell>
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-300 max-w-[200px] truncate">
                      {v.description}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(v.amount)}
                    </TableCell>
                    <TableCell>
                      {v.isPosted ? <Badge variant="success">Posted to GL</Badge> : <Badge variant="outline">Cancelled</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {v.isPosted && (
                        <button
                          onClick={() => {
                            if (confirm(`Cancel ${v.voucherNumber}? This will reverse the cash intake and restore the customer's receivable balance.`)) {
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
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Receipt Date
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
                Deposit Into
              </label>
              <select
                value={depositAccountCode}
                onChange={(e) => setDepositAccountCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <option value="100100">100100 — Cash in Hand (Counter)</option>
                <option value="100110">100110 — Meezan Bank Operating A/C</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Received From Customer
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Amount Received (PKR)
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
                Receipt / Cheque / Online Ref
              </label>
              <input
                type="text"
                placeholder="e.g. REC-102 or Online TXN"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Description / Narration
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Cleared bill for Banquet event"
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save & Post Voucher
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

