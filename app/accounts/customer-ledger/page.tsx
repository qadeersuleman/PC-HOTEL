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
      subtitle="Official guest credit accounts, Cash Receipt Vouchers (CRV), dining tabs, and running receivables"
      breadcrumbs={[
        { label: 'Customers', href: '/customers' },
        { label: 'Customer Ledger' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Icons.Printer size={15} />
            <span>Print Statement</span>
          </Button>
        </div>
      }
    >
      {/* Customer Selector & Date Filter */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-96">
              <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                Select Customer Account
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] font-medium focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all"
              >
                {customers.length === 0 ? (
                  <option value="">No customer accounts created</option>
                ) : (
                  customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.accountNo}] {c.name} • {c.category}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex-1 md:w-44">
                <label className="block text-[12px] font-medium text-[#64748B] mb-1">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-11 px-3 text-[13px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>
              <div className="flex-1 md:w-44">
                <label className="block text-[12px] font-medium text-[#64748B] mb-1">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-11 px-3 text-[13px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Account Summary Banner */}
      {currentCustomer && ledgerResult ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#1D4ED8]" />
          
          <div className="space-y-1.5 pl-2">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[12px] font-bold px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                A/C #{currentCustomer.accountNo}
              </span>
              <Badge variant="primary" size="sm">{currentCustomer.category}</Badge>
            </div>
            <h2 className="text-2xl font-bold text-[#172554] tracking-tight">{currentCustomer.name}</h2>
            <p className="text-[13px] text-[#64748B] flex items-center gap-4">
              <span>Phone: <strong className="text-[#334155]">{currentCustomer.phone || 'N/A'}</strong></span>
              <span>Credit Limit: <strong className="text-[#334155]">{currentCustomer.creditLimit ? formatCurrency(currentCustomer.creditLimit) : 'Unlimited'}</strong></span>
            </p>
          </div>

          <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] md:min-w-[260px] text-right">
            <span className="text-[12px] text-[#64748B] uppercase tracking-wider font-semibold block">
              Outstanding Balance
            </span>
            <p className="text-2xl font-bold font-mono tabular-nums text-[#172554] mt-0.5">
              {formatCurrency(ledgerResult.closingBalance)}
            </p>
            <div className="mt-1.5">
              {ledgerResult.balanceNature === 'DEBIT' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                  ● Net Receivable (Guest owes us)
                </span>
              ) : ledgerResult.balanceNature === 'CREDIT' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                  ● Advance Deposit (Paid in advance)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                  ✓ Account Settled (NIL)
                </span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Ledger Table */}
      <Card>
        {!ledgerResult || ledgerResult.entries.length === 0 ? (
          <EmptyState
            icon="UserCheck"
            title="No Ledger Entries Found"
            description="There are no sales tabs, cash receipts (CRV), or opening balances for this customer account."
            actionLabel="Register New Sale"
            actionHref="/sales"
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Date</TableHead>
                  <TableHead>Voucher Type</TableHead>
                  <TableHead>Reference #</TableHead>
                  <TableHead>Description / Particulars</TableHead>
                  <TableHead className="text-right">Debit (Sales Tab)</TableHead>
                  <TableHead className="text-right">Credit (Receipt CRV)</TableHead>
                  <TableHead className="text-right">Running Balance</TableHead>
                  <TableHead className="text-center">Nature</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {ledgerResult.entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-[13px] font-mono text-[#64748B]">{formatDate(entry.date)}</TableCell>
                    <TableCell>
                      <Badge variant={entry.referenceType === 'RECEIPT_CRV' ? 'success' : 'outline'}>
                        {entry.referenceType.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[13px] font-semibold text-[#1D4ED8]">
                      {entry.referenceNumber}
                    </TableCell>
                    <TableCell className="text-[13px] text-[#334155] max-w-[280px]">
                      {entry.description}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[13px] tabular-nums">
                      {entry.debit > 0 ? (
                        <span className="text-[#1D4ED8] font-semibold">{formatCurrency(entry.debit)}</span>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[13px] tabular-nums">
                      {entry.credit > 0 ? (
                        <span className="text-[#047857] font-semibold">{formatCurrency(entry.credit)}</span>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-[13px] tabular-nums text-[#172554]">
                      {formatCurrency(entry.runningBalance)}
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.balanceNature === 'DEBIT' && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">DR</span>
                      )}
                      {entry.balanceNature === 'CREDIT' && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">CR</span>
                      )}
                      {entry.balanceNature === 'NIL' && (
                        <span className="text-[11px] text-[#94A3B8]">NIL</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Reconciliation Footer Bar */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap justify-between items-center text-[13px] font-bold text-[#334155] gap-4">
              <div className="flex items-center gap-6">
                <span>Total Charges (Debit): <strong className="text-[#1D4ED8] font-mono">{formatCurrency(ledgerResult.totalDebit)}</strong></span>
                <span>Total Receipts (Credit): <strong className="text-[#047857] font-mono">{formatCurrency(ledgerResult.totalCredit)}</strong></span>
              </div>
              <div className="text-[14px]">
                Closing Receivable: <span className="text-[#1D4ED8] font-mono font-bold text-base ml-1">{formatCurrency(ledgerResult.closingBalance)}</span>
                <span className="text-[12px] font-semibold text-[#64748B] ml-1">({ledgerResult.balanceNature})</span>
              </div>
            </div>
          </>
        )}
      </Card>
    </PageContainer>
  );
}

export default function CustomerLedgerPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[14px] text-[#64748B]">Loading Customer Ledger...</div>}>
      <CustomerLedgerContent />
    </Suspense>
  );
}
