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
import { Voucher, JournalLine } from '../../../types/voucher';

interface JVLineForm {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  description: string;
}

export default function JournalVouchersPage() {
  const { vouchers, accounts, saveVoucher, cancelVoucher } = useERPStorage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJV, setSelectedJV] = useState<Voucher | null>(null);

  // Form State
  const [date, setDate] = useState(getTodayDateString());
  const [description, setDescription] = useState('Month-end depreciation / expense adjustment');
  const [referenceNo, setReferenceNo] = useState('');

  const [lines, setLines] = useState<JVLineForm[]>([
    { id: '1', accountId: accounts[0]?.id || '', debit: 1000, credit: 0, description: 'Debit adjustment' },
    { id: '2', accountId: accounts[1]?.id || '', debit: 0, credit: 1000, description: 'Credit adjustment' },
  ]);

  const jvVouchers = vouchers.filter((v) => v.voucherType === 'JV');

  // Balance calculation
  const totalDebit = round2(lines.reduce((s, l) => s + (l.debit || 0), 0));
  const totalCredit = round2(lines.reduce((s, l) => s + (l.credit || 0), 0));
  const difference = round2(Math.abs(totalDebit - totalCredit));
  const isBalanced = difference < 0.01 && totalDebit > 0;

  const handleLineChange = (index: number, field: keyof JVLineForm, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const addLine = () => {
    setLines([
      ...lines,
      { id: `${Date.now()}-${lines.length}`, accountId: accounts[0]?.id || '', debit: 0, credit: 0, description: '' },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleCreateJV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;

    const voucherNumber = `JV-2026-00${jvVouchers.length + 1}`;

    const formattedLines: JournalLine[] = lines.map((l) => {
      const acc = accounts.find((a) => a.id === l.accountId)!;
      return {
        id: `jl-${Date.now()}-${l.id}`,
        accountId: l.accountId,
        accountCode: acc.code,
        accountName: acc.name,
        debit: round2(l.debit || 0),
        credit: round2(l.credit || 0),
        description: l.description || description,
      };
    });

    const newVoucher: Voucher = {
      id: `v-jv-${Date.now()}`,
      voucherNumber,
      voucherType: 'JV',
      date,
      description,
      referenceNo,
      amount: totalDebit,
      lines: formattedLines,
      isPosted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveVoucher(newVoucher);
    setIsModalOpen(false);
  };

  return (
    <PageContainer
      title="JV — Journal Vouchers"
      subtitle="Manual double-entry adjustments, depreciation, accruals, and inter-account transfers"
      actions={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Icons.Plus size={14} />
          <span>New Journal Voucher (JV)</span>
        </Button>
      }
    >
      <Card>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Voucher #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Ref #</TableHead>
              <TableHead>Narration / Description</TableHead>
              <TableHead>Debit Total</TableHead>
              <TableHead>Credit Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {jvVouchers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-zinc-400 text-xs">
                  No journal vouchers created yet.
                </td>
              </tr>
            ) : (
              jvVouchers.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {v.voucherNumber}
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(v.date)}</TableCell>
                  <TableCell className="text-xs font-mono text-zinc-500">{v.referenceNo || '—'}</TableCell>
                  <TableCell className="text-xs font-medium text-zinc-800 dark:text-zinc-200 max-w-[280px]">
                    {v.description}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(v.amount)}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(v.amount)}
                  </TableCell>
                  <TableCell>
                    {v.isPosted ? <Badge variant="success">Posted (Balanced)</Badge> : <Badge variant="outline">Cancelled</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => setSelectedJV(v)}
                      className="p-1 rounded text-zinc-500 hover:text-emerald-600"
                    >
                      <Icons.Eye size={16} />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* View JV Modal */}
      {selectedJV && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedJV(null)}
          title={`Journal Voucher: ${selectedJV.voucherNumber}`}
          description={`Balanced double-entry journal created on ${formatDate(selectedJV.date)}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-300 italic">{selectedJV.description}</p>
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>Account Code</TableHead>
                    <TableHead>Account Title</TableHead>
                    <TableHead>Line Narration</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {selectedJV.lines.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs">{l.accountCode}</TableCell>
                      <TableCell className="font-semibold text-xs">{l.accountName}</TableCell>
                      <TableCell className="text-xs text-zinc-500">{l.description || '—'}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{l.debit > 0 ? formatCurrency(l.debit) : '—'}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{l.credit > 0 ? formatCurrency(l.credit) : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedJV(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add JV Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Journal Voucher (JV)"
        description="Double-entry journal. Strictly requires total debits to equal total credits before saving."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateJV} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Journal Date
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
                Reference / Bill #
              </label>
              <input
                type="text"
                placeholder="e.g. ADJ-REF-01"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              General Narration
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Allocation of kitchen utilities to prep overhead"
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>

          {/* Dynamic Lines */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Journal Lines</span>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Icons.Plus size={13} />
                <span>Add Line</span>
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {lines.map((line, idx) => (
                <div key={line.id} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 text-xs">
                  <div className="flex-1">
                    <select
                      value={line.accountId}
                      onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} — {a.name} ({a.category})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-28">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Debit"
                      value={line.debit || ''}
                      onChange={(e) => {
                        handleLineChange(idx, 'debit', parseFloat(e.target.value) || 0);
                        if (parseFloat(e.target.value) > 0) handleLineChange(idx, 'credit', 0);
                      }}
                      className="w-full px-2 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono text-right"
                    />
                  </div>
                  <div className="w-28">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Credit"
                      value={line.credit || ''}
                      onChange={(e) => {
                        handleLineChange(idx, 'credit', parseFloat(e.target.value) || 0);
                        if (parseFloat(e.target.value) > 0) handleLineChange(idx, 'debit', 0);
                      }}
                      className="w-full px-2 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono text-right"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={lines.length <= 2}
                    onClick={() => removeLine(idx)}
                    className="p-1 text-zinc-400 hover:text-rose-600 disabled:opacity-20"
                  >
                    <Icons.Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Validation Balance Bar */}
            <div className={`p-3 rounded-lg border text-xs flex justify-between items-center ${isBalanced ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-800 dark:text-rose-300'}`}>
              <div>
                <span className="font-semibold">Debits: {formatCurrency(totalDebit)}</span>
                <span className="mx-2">•</span>
                <span className="font-semibold">Credits: {formatCurrency(totalCredit)}</span>
              </div>
              <div>
                {isBalanced ? (
                  <Badge variant="success">Balanced ($Dr = Cr$)</Badge>
                ) : (
                  <Badge variant="danger">Unbalanced by {formatCurrency(difference)}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={!isBalanced}>
              Save & Post Journal
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

