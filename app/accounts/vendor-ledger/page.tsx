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
import { calculateVendorLedger } from '../../../lib/accounting/ledger';
import { formatCurrency, formatDate } from '../../../lib/utils/formatters';

function VendorLedgerContent() {
  const searchParams = useSearchParams();
  const initialVendorId = searchParams.get('vendorId');

  const { vendors, journalEntries } = useERPStorage();
  const [selectedVendorId, setSelectedVendorId] = useState<string>(
    initialVendorId || vendors[0]?.id || ''
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const currentVendor = useMemo(
    () => vendors.find((v) => v.id === selectedVendorId),
    [vendors, selectedVendorId]
  );

  const ledgerResult = useMemo(() => {
    if (!currentVendor) return null;
    return calculateVendorLedger(currentVendor, journalEntries, startDate || undefined, endDate || undefined);
  }, [currentVendor, journalEntries, startDate, endDate]);

  return (
    <PageContainer
      title="Vendor Ledger Statement"
      subtitle="Official chronological ledger statement, credit purchase bills, cash voucher disbursements, and running balances"
      breadcrumbs={[
        { label: 'Parties', href: '/vendors' },
        { label: 'Vendor Ledger' },
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
      {/* Account Selector & Date Range Filter */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-96">
              <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                Select Vendor Account
              </label>
              <select
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] font-medium focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all"
              >
                {vendors.length === 0 ? (
                  <option value="">No vendors registered yet</option>
                ) : (
                  vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      [{v.accountNo}] {v.name} • {v.category}
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

      {/* Official Vendor Account Summary Banner */}
      {currentVendor && ledgerResult ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#0F766E]" />
          
          <div className="space-y-1.5 pl-2">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[12px] font-bold px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                A/C #{currentVendor.accountNo}
              </span>
              <Badge variant="primary" size="sm">{currentVendor.category}</Badge>
            </div>
            <h2 className="text-2xl font-bold text-[#172554] tracking-tight">{currentVendor.name}</h2>
            <p className="text-[13px] text-[#64748B] flex items-center gap-4">
              <span>Credit Terms: <strong className="text-[#334155]">{currentVendor.termsDays} Days</strong></span>
              <span>Phone: <strong className="text-[#334155]">{currentVendor.phone || 'N/A'}</strong></span>
            </p>
          </div>

          <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] md:min-w-[260px] text-right">
            <span className="text-[12px] text-[#64748B] uppercase tracking-wider font-semibold block">
              Closing Ledger Balance
            </span>
            <p className="text-2xl font-bold font-mono tabular-nums text-[#172554] mt-0.5">
              {formatCurrency(ledgerResult.closingBalance)}
            </p>
            <div className="mt-1.5">
              {ledgerResult.balanceNature === 'CREDIT' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]">
                  ● Net Payable (We owe supplier)
                </span>
              ) : ledgerResult.balanceNature === 'DEBIT' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                  ● Advance Deposit (Supplier owes us)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
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
            icon="BookOpen"
            title="No Ledger Entries Found"
            description="There are no purchase invoices, payments, or opening balance records for this vendor account yet."
            actionLabel="Create Purchase Bill"
            actionHref="/purchases/new"
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
                  <TableHead className="text-right">Debit (Payment/Adv)</TableHead>
                  <TableHead className="text-right">Credit (Bill/Purchase)</TableHead>
                  <TableHead className="text-right">Running Balance</TableHead>
                  <TableHead className="text-center">Nature</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {ledgerResult.entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-[13px] font-mono text-[#64748B]">{formatDate(entry.date)}</TableCell>
                    <TableCell>
                      <Badge variant={entry.referenceType === 'PAYMENT_CPV' ? 'success' : 'outline'}>
                        {entry.referenceType.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[13px] font-semibold text-[#0F766E]">
                      {entry.referenceNumber}
                    </TableCell>
                    <TableCell className="text-[13px] text-[#334155] max-w-[280px]">
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
                      {formatCurrency(entry.runningBalance)}
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.balanceNature === 'CREDIT' && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]">CR</span>
                      )}
                      {entry.balanceNature === 'DEBIT' && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">DR</span>
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
                <span>Total Disbursements (Debit): <strong className="text-[#047857] font-mono">{formatCurrency(ledgerResult.totalDebit)}</strong></span>
                <span>Total Bills (Credit): <strong className="text-[#C2410C] font-mono">{formatCurrency(ledgerResult.totalCredit)}</strong></span>
              </div>
              <div className="text-[14px]">
                Closing Balance: <span className="text-[#0F766E] font-mono font-bold text-base ml-1">{formatCurrency(ledgerResult.closingBalance)}</span>
                <span className="text-[12px] font-semibold text-[#64748B] ml-1">({ledgerResult.balanceNature})</span>
              </div>
            </div>
          </>
        )}
      </Card>
    </PageContainer>
  );
}

export default function VendorLedgerPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[14px] text-[#64748B]">Loading Vendor Ledger...</div>}>
      <VendorLedgerContent />
    </Suspense>
  );
}
