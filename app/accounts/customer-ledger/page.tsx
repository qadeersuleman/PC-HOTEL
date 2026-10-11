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
import { calculateCustomerLedger } from '../../../lib/accounting/ledger';
import { formatCurrency, formatDate } from '../../../lib/utils/formatters';

function CustomerLedgerContent() {
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams.get('customerId');

  const { customers, journalEntries } = useERPStorage();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomerId || customers[0]?.id || ''
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const currentCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  const ledgerResult = useMemo(() => {
    if (!currentCustomer) return null;
    return calculateCustomerLedger(currentCustomer, journalEntries, startDate || undefined, endDate || undefined);
  }, [currentCustomer, journalEntries, startDate, endDate]);

  return (
    <PageContainer
      title="Customer Ledger Statement"
      subtitle="Track guest credit accounts, receipts (CRV), dining tabs, and running receivables"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Icons.Printer size={14} />
            <span>Print Statement</span>
          </Button>
        </div>
      }
    >
      {/* Customer Selector & Date Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-96">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Select Customer Account
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-medium"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.accountNo}] {c.name} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Banner */}
      {currentCustomer && ledgerResult && (
        <Card className="bg-gradient-to-r from-blue-950 to-zinc-900 text-white border-0">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10">
                  A/C #{currentCustomer.accountNo}
                </span>
                <span className="text-xs text-blue-300">{currentCustomer.category}</span>
              </div>
              <h2 className="text-xl font-bold mt-1">{currentCustomer.name}</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Phone: {currentCustomer.phone || 'N/A'} • Credit Limit: {currentCustomer.creditLimit ? formatCurrency(currentCustomer.creditLimit) : 'None'}
              </p>
            </div>

            <div className="text-right sm:border-l sm:border-white/10 sm:pl-6">
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold block">
                Outstanding Receivable
              </span>
              <p className="text-2xl font-bold mt-1 text-blue-400">
                {formatCurrency(ledgerResult.closingBalance)}
              </p>
              <div className="mt-1">
                {ledgerResult.balanceNature === 'DEBIT' ? (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    Debit (Customer owes restaurant)
                  </span>
                ) : ledgerResult.balanceNature === 'CREDIT' ? (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Credit (Advance from guest)
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400">Account Fully Settled (NIL)</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ledger Table */}
      <Card>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Ref #</TableHead>
              <TableHead>Description / Particulars</TableHead>
              <TableHead className="text-right">Debit (Sales / Food Tab)</TableHead>
              <TableHead className="text-right">Credit (Receipt CRV)</TableHead>
              <TableHead className="text-right">Running Balance</TableHead>
              <TableHead>Nature</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {!ledgerResult || ledgerResult.entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-zinc-400 text-xs">
                  No ledger activity found for this customer.
                </td>
              </tr>
            ) : (
              ledgerResult.entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs font-mono">{formatDate(entry.date)}</TableCell>
                  <TableCell>
                    <Badge variant={entry.referenceType === 'RECEIPT_CRV' ? 'success' : 'outline'}>
                      {entry.referenceType.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {entry.referenceNumber}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-800 dark:text-zinc-200 max-w-[280px]">
                    {entry.description}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(entry.runningBalance)}
                  </TableCell>
                  <TableCell>
                    {entry.balanceNature === 'DEBIT' && (
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">DR (Receivable)</span>
                    )}
                    {entry.balanceNature === 'CREDIT' && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">CR (Advance)</span>
                    )}
                    {entry.balanceNature === 'NIL' && (
                      <span className="text-[10px] text-zinc-400">NIL</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {ledgerResult && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex flex-wrap justify-between items-center text-xs font-bold gap-3">
            <span>Total Debits: {formatCurrency(ledgerResult.totalDebit)}</span>
            <span>Total Credits: {formatCurrency(ledgerResult.totalCredit)}</span>
            <span className="text-blue-600 dark:text-blue-400 text-sm">
              Closing Receivable: {formatCurrency(ledgerResult.closingBalance)} ({ledgerResult.balanceNature})
            </span>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}

export default function CustomerLedgerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-400">Loading Customer Ledger...</div>}>
      <CustomerLedgerContent />
    </Suspense>
  );
}

