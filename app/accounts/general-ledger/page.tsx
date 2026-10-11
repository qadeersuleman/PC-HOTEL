'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { EmptyState } from '../../../components/ui/empty-state';
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
      breadcrumbs={[
        { label: 'Financial Accounts', href: '/accounts/chart-of-accounts' },
        { label: 'General Ledger' },
      ]}
      actions={
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Icons.Printer size={15} />
          <span>Print Ledger</span>
        </Button>
      }
    >
      {/* Account Picker & Date Filters */}
      <Card>
        <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-96">
            <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
              Select General Ledger Account
            </label>
            <select
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
              className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] font-medium focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.code}>
                  [{acc.code}] {acc.name} • ({acc.category})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:w-44">
              <label className="block text-[12px] font-medium text-[#64748B] mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-11 px-3 text-[13px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>
            <div className="flex-1 md:w-44">
              <label className="block text-[12px] font-medium text-[#64748B] mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-11 px-3 text-[13px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Header Banner */}
      {currentAccount && glResult ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#0F766E]" />
          
          <div className="space-y-1.5 pl-2">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[12px] font-bold px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                Account #{currentAccount.code}
              </span>
              <Badge variant="primary" size="sm">{currentAccount.category}</Badge>
              <span className="text-[12px] text-[#64748B] font-mono">Normal: {currentAccount.normalBalance}</span>
            </div>
            <h2 className="text-2xl font-bold text-[#172554] tracking-tight">{currentAccount.name}</h2>
            {currentAccount.description && (
              <p className="text-[13px] text-[#64748B]">{currentAccount.description}</p>
            )}
          </div>

          <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] md:min-w-[260px] text-right">
            <span className="text-[12px] text-[#64748B] uppercase tracking-wider font-semibold block">
              Closing Ledger Balance
            </span>
            <p className="text-2xl font-bold font-mono tabular-nums text-[#172554] mt-0.5">
              {formatCurrency(glResult.closingBalance)}
            </p>
            <span className="text-[11px] font-bold text-[#0F766E] uppercase tracking-wider mt-1 block">
              Standard Double-Entry Posting
            </span>
          </div>
        </div>
      ) : null}

      {/* Ledger Entries Table */}
      <Card>
        {!glResult || glResult.entries.length === 0 ? (
          <EmptyState
            icon="BookOpen"
            title="No Posted Transactions"
            description="No journal entries or transactions were posted to this account during the selected date range."
            actionLabel="View Chart of Accounts"
            actionHref="/accounts/chart-of-accounts"
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Date</TableHead>
                  <TableHead>Source Type</TableHead>
                  <TableHead>Reference #</TableHead>
                  <TableHead>Description / Particulars</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Running Balance</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {glResult.entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-[13px] font-mono text-[#64748B]">{formatDate(entry.date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.sourceType}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[13px] font-semibold text-[#0F766E]">
                      {entry.sourceNumber}
                    </TableCell>
                    <TableCell className="text-[13px] text-[#334155] max-w-[320px]">
                      {entry.description}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[13px] tabular-nums">
                      {entry.debit > 0 ? (
                        <span className="text-[#047857] font-semibold">{formatCurrency(entry.debit)}</span>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[13px] tabular-nums">
                      {entry.credit > 0 ? (
                        <span className="text-[#C2410C] font-semibold">{formatCurrency(entry.credit)}</span>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-[13px] tabular-nums text-[#172554]">
                      {formatCurrency(entry.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap justify-between items-center text-[13px] font-bold text-[#334155] gap-4">
              <div className="flex items-center gap-6">
                <span>Total Debits: <strong className="text-[#047857] font-mono">{formatCurrency(glResult.totalDebit)}</strong></span>
                <span>Total Credits: <strong className="text-[#C2410C] font-mono">{formatCurrency(glResult.totalCredit)}</strong></span>
              </div>
              <div className="text-[14px]">
                Closing Balance: <span className="text-[#0F766E] font-mono font-bold text-base ml-1">{formatCurrency(glResult.closingBalance)}</span>
              </div>
            </div>
          </>
        )}
      </Card>
    </PageContainer>
  );
}

export default function GeneralLedgerPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[14px] text-[#64748B]">Loading General Ledger...</div>}>
      <GeneralLedgerContent />
    </Suspense>
  );
}
