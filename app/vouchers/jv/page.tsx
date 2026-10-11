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
import { Voucher, JournalLine } from '../../../types/voucher';

interface JVLineForm {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  description: string;
}

export default function JournalVouchersPage() {
  const { vouchers, accounts, saveVoucher } = useERPStorage();
  const toast = useToast();
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
    if (!isBalanced) {
      toast.error('Unbalanced Journal', 'Total Debits must equal Total Credits before posting.');
      return;
    }

    const voucherNumber = `JV-2026-00${jvVouchers.length + 1}`;

    const formattedLines: JournalLine[] = lines.map((l) => {
      const acc = accounts.find((a) => a.id === l.accountId)!;
      return {
        id: `jl-${Date.now()}-${l.id}`,
        accountId: l.accountId,
        accountCode: acc?.code || '000000',
        accountName: acc?.name || 'Account',
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

    try {
      await saveVoucher(newVoucher);
      toast.success('Journal Posted', `Voucher ${voucherNumber} posted with ${formatCurrency(totalDebit)} balanced.`);
      setIsModalOpen(false);
    } catch {
      toast.error('Error', 'Failed to save Journal Voucher.');
    }
  };

  return (
    <PageContainer
      title="JV — Journal Vouchers"
      subtitle="Manual double-entry adjustments, depreciation, accruals, and inter-account ledger transfers"
      breadcrumbs={[
        { label: 'Vouchers & GL', href: '/accounts/general-ledger' },
        { label: 'Journal Vouchers (JV)' },
      ]}
      actions={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Icons.Plus size={15} />
          <span>New Journal Voucher (JV)</span>
        </Button>
      }
    >
      <Card>
        {jvVouchers.length === 0 ? (
          <EmptyState
            icon="FileText"
            title="No Journal Vouchers Found"
            description="Create formal balanced debit/credit adjustments and non-cash journal entries."
            actionLabel="Create Journal Voucher"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Voucher #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reference #</TableHead>
                <TableHead>Narration / Description</TableHead>
                <TableHead className="text-right">Debit Total (PKR)</TableHead>
                <TableHead className="text-right">Credit Total (PKR)</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {jvVouchers.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono font-bold text-[#172554] text-[13px]">
                    {v.voucherNumber}
                  </TableCell>
                  <TableCell className="text-[13px] text-[#64748B] font-mono">{formatDate(v.date)}</TableCell>
                  <TableCell className="text-[13px] font-mono text-[#64748B]">{v.referenceNo || '—'}</TableCell>
                  <TableCell className="text-[13px] text-[#334155] max-w-[280px]">
                    {v.description}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-[#172554] text-[13px] tabular-nums">
                    {formatCurrency(v.amount)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-[#172554] text-[13px] tabular-nums">
                    {formatCurrency(v.amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    {v.isPosted ? (
                      <Badge variant="success">Balanced ($Dr=Cr$)</Badge>
                    ) : (
                      <Badge variant="error">Cancelled</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedJV(v)}
                    >
                      <Icons.Eye size={13} />
                      <span>Lines</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* View JV Detail Modal */}
      {selectedJV && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedJV(null)}
          title={`Journal Voucher: ${selectedJV.voucherNumber}`}
          description={`Balanced double-entry journal created on ${formatDate(selectedJV.date)}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <p className="text-[13px] text-[#64748B] italic bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
              {selectedJV.description}
            </p>
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
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
                      <TableCell className="font-mono text-[13px] text-[#172554] font-bold">{l.accountCode}</TableCell>
                      <TableCell className="font-semibold text-[13px] text-[#334155]">{l.accountName}</TableCell>
                      <TableCell className="text-[13px] text-[#64748B]">{l.description || '—'}</TableCell>
                      <TableCell className="text-right font-mono text-[13px] tabular-nums font-semibold text-[#047857]">
                        {l.debit > 0 ? formatCurrency(l.debit) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-[13px] tabular-nums font-semibold text-[#C2410C]">
                        {l.credit > 0 ? formatCurrency(l.credit) : '—'}
                      </TableCell>
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
              <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                Journal Date
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
                Reference / Bill #
              </label>
              <input
                type="text"
                placeholder="e.g. ADJ-REF-01"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
              General Narration
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Allocation of monthly utilities or adjustments"
              className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>

          {/* Dynamic Lines */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-bold text-[#172554]">Journal Debit & Credit Lines</span>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Icons.Plus size={13} />
                <span>Add Line</span>
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {lines.map((line, idx) => (
                <div key={line.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                  <div className="flex-1">
                    <select
                      value={line.accountId}
                      onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                      className="w-full h-10 px-2.5 text-[13px] rounded-lg border border-[#CBD5E1] bg-white text-[#334155] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
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
                      className="w-full h-10 px-2 text-[13px] rounded-lg border border-[#CBD5E1] bg-white font-mono text-right text-[#047857] font-semibold focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
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
                      className="w-full h-10 px-2 text-[13px] rounded-lg border border-[#CBD5E1] bg-white font-mono text-right text-[#C2410C] font-semibold focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={lines.length <= 2}
                    onClick={() => removeLine(idx)}
                    className="p-1.5 text-[#94A3B8] hover:text-[#B91C1C] disabled:opacity-20 transition-colors"
                  >
                    <Icons.Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Validation Balance Bar */}
            <div className={`p-3.5 rounded-xl border text-[13px] flex justify-between items-center ${
              isBalanced
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]'
                : 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
            }`}>
              <div>
                <span className="font-semibold">Debits: <strong className="font-mono">{formatCurrency(totalDebit)}</strong></span>
                <span className="mx-2.5 text-[#94A3B8]">|</span>
                <span className="font-semibold">Credits: <strong className="font-mono">{formatCurrency(totalCredit)}</strong></span>
              </div>
              <div>
                {isBalanced ? (
                  <Badge variant="success">Balanced ($Dr = Cr$)</Badge>
                ) : (
                  <Badge variant="error">Unbalanced by {formatCurrency(difference)}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
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
