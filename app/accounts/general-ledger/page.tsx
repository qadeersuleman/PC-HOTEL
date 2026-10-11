'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { calculateAccountGeneralLedger } from '../../../lib/accounting/ledger';
import { formatCurrency, formatDate } from '../../../lib/utils/formatters';

function GeneralLedgerContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('accountCode');

  const { accounts, journalEntries } = useERPStorage();
  const [selectedCode, setSelectedCode] = useState<string>(
    initialCode || accounts[0]?.code || '100100'
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const currentAccount = useMemo(
    () => accounts.find((a) => a.code === selectedCode),
    [accounts, selectedCode]
  );

  const glResult = useMemo(() => {
    if (!currentAccount) return null;
    return calculateAccountGeneralLedger(currentAccount, journalEntries, startDate || undefined, endDate || undefined);
  }, [currentAccount, journalEntries, startDate, endDate]);

  return (
    <PageContainer
      title="General Ledger (GL)"
      subtitle="Complete chronological transaction audit log for every balance sheet and income statement account"
      actions={
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Icons.Printer size={14} />
          <span>Print Ledger</span>
        </Button>
      }
    >
      {/* Account Picker */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-96">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Select General Ledger Account
            </label>
            <select
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-medium"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.code}>
                  [{acc.code}] {acc.name} — ({acc.category})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Header Banner */}
      {currentAccount && glResult && (
        <Card className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white border-0">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10">
                  Code #{currentAccount.code}
                </span>
                <Badge variant="outline">{currentAccount.category}</Badge>
                <span className="text-xs text-zinc-400">Normal: {currentAccount.normalBalance}</span>
              </div>
              <h2 className="text-xl font-bold mt-1.5">{currentAccount.name}</h2>
              {currentAccount.description && (
                <p className="text-xs text-zinc-400 mt-0.5">{currentAccount.description}</p>
              )}
            </div>

            <div className="text-right sm:border-l sm:border-white/10 sm:pl-6">
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold block">
                Closing Account Balance
              </span>
              <p className="text-2xl font-bold mt-1 text-emerald-400">
                {formatCurrency(glResult.closingBalance)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ledger Entries Table */}
      <Card>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Date</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Ref Number</TableHead>
              <TableHead>Description / Particulars</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead className="text-right">Running Balance</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {!glResult || glResult.entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-zinc-400 text-xs">
                  No posted transactions for this account during this period.
                </td>
              </tr>
            ) : (
              glResult.entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs font-mono">{formatDate(entry.date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.sourceType}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {entry.sourceNumber}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-800 dark:text-zinc-200 max-w-[320px]">
                    {entry.description}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(entry.balance)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {glResult && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex flex-wrap justify-between items-center text-xs font-bold gap-3">
            <span>Total Debits: {formatCurrency(glResult.totalDebit)}</span>
            <span>Total Credits: {formatCurrency(glResult.totalCredit)}</span>
            <span className="text-emerald-600 dark:text-emerald-400 text-sm">
              Closing Balance: {formatCurrency(glResult.closingBalance)}
            </span>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}

export default function GeneralLedgerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-400">Loading General Ledger...</div>}>
      <GeneralLedgerContent />
    </Suspense>
  );
}

