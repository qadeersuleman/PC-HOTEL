'use client';

import React, { useState, useMemo } from 'react';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { calculatePayablesAging } from '../../../lib/accounting/payable-receivable';
import { formatCurrency, getTodayDateString } from '../../../lib/utils/formatters';

export default function AgingReportsPage() {
  const { vendors, purchases, customers, sales } = useERPStorage();
  const [activeTab, setActiveTab] = useState<'PAYABLES' | 'RECEIVABLES'>('PAYABLES');
  const [asOfDate, setAsOfDate] = useState(getTodayDateString());

  const payablesAging = useMemo(() => {
    return calculatePayablesAging(vendors, purchases, asOfDate);
  }, [vendors, purchases, asOfDate]);

  return (
    <PageContainer
      title="Payables & Receivables Aging Analysis"
      subtitle="Track aged unpaid purchase invoices and overdue customer credit buckets"
      actions={
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Icons.Printer size={14} />
          <span>Print Aging Schedule</span>
        </Button>
      }
    >
      {/* Tab Switcher & Date */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('PAYABLES')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'PAYABLES'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              Accounts Payable Aging (Suppliers)
            </button>
            <button
              onClick={() => setActiveTab('RECEIVABLES')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'RECEIVABLES'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              Accounts Receivable Aging (Customers)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Aging As of:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payables Aging Table */}
      {activeTab === 'PAYABLES' ? (
        <Card>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Account No</TableHead>
                <TableHead>Vendor Name</TableHead>
                <TableHead className="text-right">0 - 15 Days (Current)</TableHead>
                <TableHead className="text-right">16 - 30 Days</TableHead>
                <TableHead className="text-right">31 - 60 Days</TableHead>
                <TableHead className="text-right">Over 60 Days</TableHead>
                <TableHead className="text-right">Total Outstanding</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {payablesAging.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-400 text-xs">
                    No overdue purchase invoices found for this period.
                  </td>
                </tr>
              ) : (
                payablesAging.map((bucket) => (
                  <TableRow key={bucket.partyId}>
                    <TableCell className="font-mono font-bold text-xs">{bucket.accountNo}</TableCell>
                    <TableCell className="font-semibold text-xs">{bucket.partyName}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {bucket.current > 0 ? formatCurrency(bucket.current) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {bucket.days16to30 > 0 ? formatCurrency(bucket.days16to30) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {bucket.days31to60 > 0 ? formatCurrency(bucket.days31to60) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-rose-600">
                      {bucket.daysOver60 > 0 ? formatCurrency(bucket.daysOver60) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs text-amber-600">
                      {formatCurrency(bucket.totalOutstanding)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Account No</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead className="text-right">0 - 15 Days (Current)</TableHead>
                <TableHead className="text-right">16 - 30 Days</TableHead>
                <TableHead className="text-right">31 - 60 Days</TableHead>
                <TableHead className="text-right">Over 60 Days</TableHead>
                <TableHead className="text-right">Total Outstanding</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {customers
                .filter((c) => c.openingBalance > 0)
                .map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-bold text-xs">{c.accountNo}</TableCell>
                    <TableCell className="font-semibold text-xs">{c.name}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatCurrency(c.openingBalance)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">—</TableCell>
                    <TableCell className="text-right font-mono text-xs">—</TableCell>
                    <TableCell className="text-right font-mono text-xs">—</TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs text-blue-600">
                      {formatCurrency(c.openingBalance)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </PageContainer>
  );
}

