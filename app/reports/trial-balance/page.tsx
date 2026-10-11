'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { generateTrialBalance } from '../../../lib/accounting/financial-statements';
import { formatCurrency, getTodayDateString } from '../../../lib/utils/formatters';

export default function TrialBalancePage() {
  const { accounts, journalEntries } = useERPStorage();
  const [asOfDate, setAsOfDate] = useState(getTodayDateString());

  const trialBalance = useMemo(() => {
    return generateTrialBalance(accounts, journalEntries, asOfDate);
  }, [accounts, journalEntries, asOfDate]);

  return (
    <PageContainer
      title="Trial Balance"
      subtitle="Reconciles total debits and credits across all general ledger accounts"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Icons.Printer size={14} />
            <span>Print Trial Balance</span>
          </Button>
        </div>
      }
    >
      {/* Date Filter & Balanced Status */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">As of Date:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>

          <div>
            {trialBalance.isBalanced ? (
              <Badge variant="success" className="px-3 py-1 text-xs">
                ✓ Trial Balance Reconciled (Debits Equal Credits)
              </Badge>
            ) : (
              <Badge variant="danger" className="px-3 py-1 text-xs">
                ⚠ Unbalanced Ledger Difference: {formatCurrency(Math.abs(trialBalance.totalDebit - trialBalance.totalCredit))}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trial Balance Table */}
      <Card>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Account Code</TableHead>
              <TableHead>Account Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Debit (PKR)</TableHead>
              <TableHead className="text-right">Credit (PKR)</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {trialBalance.rows.map((row) => (
              <TableRow key={row.accountId}>
                <TableCell className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {row.accountCode}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/accounts/general-ledger?accountCode=${row.accountCode}`}
                    className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-emerald-600"
                  >
                    {row.accountName}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{row.category}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-xs font-medium">
                  {row.debit > 0 ? formatCurrency(row.debit) : '—'}
                </TableCell>
                <TableCell className="text-right font-mono text-xs font-medium">
                  {row.credit > 0 ? formatCurrency(row.credit) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Grand Totals */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-between items-center text-sm font-bold">
          <div className="flex items-center gap-3">
            <span>Reconciled Totals:</span>
            {trialBalance.isBalanced ? (
              <span className="text-xs text-emerald-600 font-semibold">Matched Double-Entry</span>
            ) : (
              <span className="text-xs text-rose-600 font-semibold">Unbalanced</span>
            )}
          </div>
          <div className="flex gap-8 font-mono">
            <span className="text-zinc-900 dark:text-zinc-100">Dr: {formatCurrency(trialBalance.totalDebit)}</span>
            <span className="text-zinc-900 dark:text-zinc-100">Cr: {formatCurrency(trialBalance.totalCredit)}</span>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}

