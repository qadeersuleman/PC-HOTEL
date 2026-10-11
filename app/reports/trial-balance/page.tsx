'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { EmptyState } from '../../../components/ui/empty-state';
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
      subtitle="Reconciliation of total debit and credit account balances across all general ledger categories"
      breadcrumbs={[
        { label: 'Financial Reports' },
        { label: 'Trial Balance' },
      ]}
      actions={
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Icons.Printer size={15} />
          <span>Print Trial Balance</span>
        </Button>
      }
    >
      {/* Date Filter & Reconciliation Status */}
      <Card>
        <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-[#172554]">As of Effective Date:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="h-10 px-3 text-[13px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>

          <div>
            {trialBalance.isBalanced ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                <Icons.CheckCircle size={15} className="text-[#047857]" />
                <span>Trial Balance Reconciled (Debits Equal Credits)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
                <Icons.AlertTriangle size={15} className="text-[#B91C1C]" />
                <span>Unbalanced Difference: {formatCurrency(Math.abs(trialBalance.totalDebit - trialBalance.totalCredit))}</span>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trial Balance Table */}
      <Card>
        {trialBalance.rows.length === 0 ? (
          <EmptyState
            icon="Scale"
            title="No Ledger Balances Found"
            description="No active accounts or balances found as of this date."
            actionLabel="View Chart of Accounts"
            actionHref="/accounts/chart-of-accounts"
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Account Code</TableHead>
                  <TableHead>Account Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Debit Balance (PKR)</TableHead>
                  <TableHead className="text-right">Credit Balance (PKR)</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {trialBalance.rows.map((row) => (
                  <TableRow key={row.accountId}>
                    <TableCell className="font-mono font-bold text-[#172554] text-[13px]">
                      {row.accountCode}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/accounts/general-ledger?accountCode=${row.accountCode}`}
                        className="font-semibold text-[#172554] hover:text-[#0F766E] transition-colors"
                      >
                        {row.accountName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-[13px] tabular-nums">
                      {row.debit > 0 ? (
                        <span className="text-[#047857] font-semibold">{formatCurrency(row.debit)}</span>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[13px] tabular-nums">
                      {row.credit > 0 ? (
                        <span className="text-[#C2410C] font-semibold">{formatCurrency(row.credit)}</span>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Reconciliation Double Underline Footer */}
            <div className="p-5 border-t-2 border-[#172554] bg-[#F8FAFC] flex justify-between items-center text-[14px] font-bold text-[#172554]">
              <div className="flex items-center gap-3">
                <span>Grand Reconciled Total:</span>
                {trialBalance.isBalanced && (
                  <span className="text-[12px] font-semibold text-[#047857] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
                    Balanced Ledger ($Dr = Cr$)
                  </span>
                )}
              </div>
              <div className="flex gap-10 font-mono text-base">
                <span className="text-[#047857]">Dr: {formatCurrency(trialBalance.totalDebit)}</span>
                <span className="text-[#C2410C]">Cr: {formatCurrency(trialBalance.totalCredit)}</span>
              </div>
            </div>
          </>
        )}
      </Card>
    </PageContainer>
  );
}
