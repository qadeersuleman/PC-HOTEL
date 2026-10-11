'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { EmptyState } from '../../../components/ui/empty-state';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { formatCurrency } from '../../../lib/utils/formatters';

export default function AccountsReceivablePage() {
  const { customerBalances, vendorBalances } = useERPStorage();
  const [activeTab, setActiveTab] = useState<'SEPARATED' | 'CONSOLIDATED'>('SEPARATED');
  const [search, setSearch] = useState('');

  // 1. Customer Receivables
  const filteredCustomers = customerBalances.summaries.filter(
    (c) =>
      c.netReceivable > 0 &&
      (c.name.toLowerCase().includes(search.toLowerCase()) || c.accountNo.includes(search))
  );

  // 2. Vendor Advances (Suppliers with Debit > Credit)
  const filteredVendorAdvances = vendorBalances.summaries.filter(
    (v) =>
      v.advanceAmount > 0 &&
      (v.name.toLowerCase().includes(search.toLowerCase()) || v.accountNo.includes(search))
  );

  // Combined total
  const combinedTotal = customerBalances.totalReceivable + vendorBalances.totalAdvances;

  return (
    <PageContainer
      title="Accounts Receivable & Advances"
      subtitle="Guest dining credit ledgers, banquets, staff receivables, and vendor advance prepayments"
      breadcrumbs={[
        { label: 'Financial Accounts', href: '/accounts/chart-of-accounts' },
        { label: 'Accounts Receivable' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Icons.Printer size={15} />
            <span>Print Report</span>
          </Button>
          <Link href="/vouchers/crv">
            <Button variant="primary" size="sm">
              <Icons.Plus size={15} />
              <span>Record Receipt (CRV)</span>
            </Button>
          </Link>
        </div>
      }
    >
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <span className="text-[12px] text-[#64748B] uppercase tracking-wider font-semibold">
            Customer Receivables
          </span>
          <div className="mt-2">
            <p className="text-3xl font-bold font-mono tabular-nums text-[#1D4ED8]">
              {formatCurrency(customerBalances.totalReceivable)}
            </p>
            <p className="text-[13px] text-[#64748B] mt-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1D4ED8]" />
              <span>Guest & Corporate tabs (Account 100500)</span>
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <span className="text-[12px] text-[#64748B] uppercase tracking-wider font-semibold">
            Vendor Advances (Deposits)
          </span>
          <div className="mt-2">
            <p className="text-3xl font-bold font-mono tabular-nums text-[#0F766E]">
              {formatCurrency(vendorBalances.totalAdvances)}
            </p>
            <p className="text-[13px] text-[#64748B] mt-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
              <span>Supplier advance prepayments (Account 100700)</span>
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <span className="text-[12px] text-[#64748B] uppercase tracking-wider font-semibold">
            Total Debit Receivables
          </span>
          <div className="mt-2">
            <p className="text-3xl font-bold font-mono tabular-nums text-[#172554]">
              {formatCurrency(combinedTotal)}
            </p>
            <p className="text-[13px] text-[#64748B] mt-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#047857]" />
              <span>Consolidated asset balance</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tab Switcher & Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <button
              onClick={() => setActiveTab('SEPARATED')}
              className={`px-4 py-2 text-[13px] font-semibold rounded-lg transition-all ${
                activeTab === 'SEPARATED'
                  ? 'bg-white text-[#0F766E] shadow-2xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#172554]'
              }`}
            >
              Classified View (GAAP)
            </button>
            <button
              onClick={() => setActiveTab('CONSOLIDATED')}
              className={`px-4 py-2 text-[13px] font-semibold rounded-lg transition-all ${
                activeTab === 'CONSOLIDATED'
                  ? 'bg-white text-[#0F766E] shadow-2xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#172554]'
              }`}
            >
              Consolidated Statement
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
            <input
              type="text"
              placeholder="Search debtor accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* Render Based on Tab */}
      {activeTab === 'SEPARATED' ? (
        <div className="space-y-6">
          {/* Section 1: Customer Receivables */}
          <Card>
            <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]/50">
              <div>
                <h3 className="font-bold text-base text-[#172554]">
                  Customer & Guest Receivables
                </h3>
                <p className="text-[13px] text-[#64748B]">Credit extended for dining tabs, banquets, and staff accounts</p>
              </div>
              <Badge variant="info">Asset Account #100500</Badge>
            </div>
            
            {filteredCustomers.length === 0 ? (
              <EmptyState
                icon="UserCheck"
                title="No Customer Receivables"
                description="There are currently no outstanding debit balances on customer accounts."
                actionLabel="New Sales Entry"
                actionHref="/sales"
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHead>Account No</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead className="text-right">Debit (Tabs)</TableHead>
                      <TableHead className="text-right">Credit (Receipts)</TableHead>
                      <TableHead className="text-right">Receivable Amount</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((cust) => (
                      <TableRow key={cust.customerId}>
                        <TableCell className="font-mono font-bold text-[#172554] text-[13px]">{cust.accountNo}</TableCell>
                        <TableCell>
                          <p className="font-semibold text-[#172554] text-[14px]">{cust.name}</p>
                          <p className="text-[12px] text-[#64748B]">{cust.category}</p>
                        </TableCell>
                        <TableCell className="text-right font-mono text-[13px] tabular-nums text-[#1D4ED8]">{formatCurrency(cust.totalDebit)}</TableCell>
                        <TableCell className="text-right font-mono text-[13px] tabular-nums text-[#64748B]">{formatCurrency(cust.totalCredit)}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-[#1D4ED8] text-[14px] tabular-nums">
                          {formatCurrency(cust.netReceivable)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/accounts/customer-ledger?customerId=${cust.customerId}`}>
                            <Button variant="outline" size="sm">
                              <Icons.BookOpen size={13} />
                              <span>Ledger</span>
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center text-[13px] font-bold text-[#334155]">
                  <span>Total Customer Receivables:</span>
                  <span className="text-[#1D4ED8] font-mono text-base tabular-nums">{formatCurrency(customerBalances.totalReceivable)}</span>
                </div>
              </>
            )}
          </Card>

          {/* Section 2: Vendor Advances */}
          <Card>
            <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]/50">
              <div>
                <h3 className="font-bold text-base text-[#172554]">
                  Vendor Advances (Supplier Debit Balances)
                </h3>
                <p className="text-[13px] text-[#64748B]">
                  Prepayments, security deposits, and overpayments held with food suppliers
                </p>
              </div>
              <Badge variant="purple">Asset Account #100700</Badge>
            </div>

            {filteredVendorAdvances.length === 0 ? (
              <EmptyState
                icon="Users"
                title="No Vendor Advances"
                description="There are currently no supplier advance balances on file."
                actionLabel="Create Payment Voucher"
                actionHref="/vouchers/cpv"
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHead>Account No</TableHead>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead className="text-right">Debit (Paid)</TableHead>
                      <TableHead className="text-right">Credit (Bills)</TableHead>
                      <TableHead className="text-right">Advance Amount</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {filteredVendorAdvances.map((ven) => (
                      <TableRow key={ven.vendorId}>
                        <TableCell className="font-mono font-bold text-[#172554] text-[13px]">{ven.accountNo}</TableCell>
                        <TableCell>
                          <p className="font-semibold text-[#172554] text-[14px]">{ven.name}</p>
                          <p className="text-[12px] text-[#64748B]">{ven.category}</p>
                        </TableCell>
                        <TableCell className="text-right font-mono text-[13px] tabular-nums text-[#047857]">{formatCurrency(ven.totalDebit)}</TableCell>
                        <TableCell className="text-right font-mono text-[13px] tabular-nums text-[#64748B]">{formatCurrency(ven.totalCredit)}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-[#0F766E] text-[14px] tabular-nums">
                          {formatCurrency(ven.advanceAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/accounts/vendor-ledger?vendorId=${ven.vendorId}`}>
                            <Button variant="outline" size="sm">
                              <Icons.BookOpen size={13} />
                              <span>Ledger</span>
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center text-[13px] font-bold text-[#334155]">
                  <span>Total Vendor Advances:</span>
                  <span className="text-[#0F766E] font-mono text-base tabular-nums">{formatCurrency(vendorBalances.totalAdvances)}</span>
                </div>
              </>
            )}
          </Card>
        </div>
      ) : (
        /* Consolidated View */
        <Card>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Account No</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead className="text-right">Debit (PKR)</TableHead>
                <TableHead className="text-right">Credit (PKR)</TableHead>
                <TableHead className="text-right">Receivable Amount (PKR)</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((c) => (
                <TableRow key={c.customerId}>
                  <TableCell className="font-mono font-bold text-[#172554]">{c.accountNo}</TableCell>
                  <TableCell className="font-semibold text-[#172554]">{c.name}</TableCell>
                  <TableCell className="text-right font-mono text-[13px] text-[#1D4ED8]">{formatCurrency(c.totalDebit)}</TableCell>
                  <TableCell className="text-right font-mono text-[13px] text-[#64748B]">{formatCurrency(c.totalCredit)}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-[14px] text-[#1D4ED8]">{formatCurrency(c.netReceivable)}</TableCell>
                </TableRow>
              ))}
              {filteredVendorAdvances.map((v) => (
                <TableRow key={v.vendorId}>
                  <TableCell className="font-mono font-bold text-[#172554]">{v.accountNo}</TableCell>
                  <TableCell className="font-semibold text-[#172554]">{v.name}</TableCell>
                  <TableCell className="text-right font-mono text-[13px] text-[#047857]">{formatCurrency(v.totalDebit)}</TableCell>
                  <TableCell className="text-right font-mono text-[13px] text-[#64748B]">{formatCurrency(v.totalCredit)}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-[14px] text-[#0F766E]">{formatCurrency(v.advanceAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center text-[13px] font-bold text-[#334155]">
            <span>Total Consolidated Debit Receivables:</span>
            <span className="text-[#047857] font-mono text-base tabular-nums">
              {formatCurrency(combinedTotal)}
            </span>
          </div>
        </Card>
      )}
    </PageContainer>
  );
}
