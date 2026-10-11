'use client';

import React, { useState, useMemo } from 'react';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { EmptyState } from '../../../components/ui/empty-state';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { calculatePayablesAging } from '../../../lib/accounting/payable-receivable';
import { formatCurrency, getTodayDateString } from '../../../lib/utils/formatters';

export default function AgingReportsPage() {
  const { vendors, purchases, customers } = useERPStorage();
  const [activeTab, setActiveTab] = useState<'PAYABLES' | 'RECEIVABLES'>('PAYABLES');
  const [asOfDate, setAsOfDate] = useState(getTodayDateString());

  const payablesAging = useMemo(() => {
    return calculatePayablesAging(vendors, purchases, asOfDate);
  }, [vendors, purchases, asOfDate]);

  return (
    <PageContainer
      title="Payables & Receivables Aging Analysis"
      subtitle="Track aged unpaid purchase bills and overdue dining receivables by 15, 30, and 60-day aging buckets"
      breadcrumbs={[
        { label: 'Financial Reports' },
        { label: 'Aging Analysis' },
      ]}
      actions={
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Icons.Printer size={15} />
          <span>Print Aging Schedule</span>
        </Button>
      }
    >
      {/* Tab Switcher & Date Filter */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <button
              onClick={() => setActiveTab('PAYABLES')}
              className={`px-4 py-2 text-[13px] font-semibold rounded-lg transition-all ${
                activeTab === 'PAYABLES'
                  ? 'bg-white text-[#0F766E] shadow-2xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#172554]'
              }`}
            >
              Accounts Payable Aging (Suppliers)
            </button>
            <button
              onClick={() => setActiveTab('RECEIVABLES')}
              className={`px-4 py-2 text-[13px] font-semibold rounded-lg transition-all ${
                activeTab === 'RECEIVABLES'
                  ? 'bg-white text-[#0F766E] shadow-2xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#172554]'
              }`}
            >
              Accounts Receivable Aging (Customers)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-[#172554]">Aging As of:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="h-10 px-3 text-[13px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payables Aging Table */}
      {activeTab === 'PAYABLES' ? (
        <Card>
          {payablesAging.length === 0 ? (
            <EmptyState
              icon="Clock"
              title="No Overdue Payables"
              description="There are currently no unpaid purchase invoices or aged liabilities due to vendors."
              actionLabel="View Purchase Bills"
              actionHref="/purchases"
            />
          ) : (
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Account No</TableHead>
                  <TableHead>Vendor / Supplier</TableHead>
                  <TableHead className="text-right">0 - 15 Days (Current)</TableHead>
                  <TableHead className="text-right">16 - 30 Days</TableHead>
                  <TableHead className="text-right">31 - 60 Days</TableHead>
                  <TableHead className="text-right">Over 60 Days</TableHead>
                  <TableHead className="text-right">Total Outstanding (PKR)</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {payablesAging.map((bucket) => (
                  <TableRow key={bucket.partyId}>
                    <TableCell className="font-mono font-bold text-[#172554] text-[13px]">{bucket.accountNo}</TableCell>
                    <TableCell className="font-semibold text-[#172554] text-[14px]">{bucket.partyName}</TableCell>
                    <TableCell className="text-right font-mono text-[13px] tabular-nums text-[#047857]">
                      {bucket.current > 0 ? formatCurrency(bucket.current) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[13px] tabular-nums text-[#64748B]">
                      {bucket.days16to30 > 0 ? formatCurrency(bucket.days16to30) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[13px] tabular-nums text-[#C2410C]">
                      {bucket.days31to60 > 0 ? formatCurrency(bucket.days31to60) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[13px] tabular-nums font-bold text-[#B91C1C]">
                      {bucket.daysOver60 > 0 ? formatCurrency(bucket.daysOver60) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-[14px] tabular-nums text-[#C2410C]">
                      {formatCurrency(bucket.totalOutstanding)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Account No</TableHead>
                <TableHead>Customer / Guest Name</TableHead>
                <TableHead className="text-right">0 - 15 Days (Current)</TableHead>
                <TableHead className="text-right">16 - 30 Days</TableHead>
                <TableHead className="text-right">31 - 60 Days</TableHead>
                <TableHead className="text-right">Over 60 Days</TableHead>
                <TableHead className="text-right">Total Outstanding (PKR)</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {customers
                .filter((c) => c.openingBalance > 0)
                .map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-bold text-[#172554] text-[13px]">{c.accountNo}</TableCell>
                    <TableCell className="font-semibold text-[#172554] text-[14px]">{c.name}</TableCell>
                    <TableCell className="text-right font-mono text-[13px] tabular-nums text-[#1D4ED8]">{formatCurrency(c.openingBalance)}</TableCell>
                    <TableCell className="text-right font-mono text-[13px] text-[#94A3B8]">—</TableCell>
                    <TableCell className="text-right font-mono text-[13px] text-[#94A3B8]">—</TableCell>
                    <TableCell className="text-right font-mono text-[13px] text-[#94A3B8]">—</TableCell>
                    <TableCell className="text-right font-mono font-bold text-[14px] tabular-nums text-[#1D4ED8]">
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
