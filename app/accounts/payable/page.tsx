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

export default function AccountsPayablePage() {
  const { vendorBalances } = useERPStorage();
  const [search, setSearch] = useState('');

  const payableVendors = vendorBalances.summaries.filter(
    (v) =>
      v.netPayable > 0 &&
      (v.name.toLowerCase().includes(search.toLowerCase()) || v.accountNo.includes(search))
  );

  return (
    <PageContainer
      title="Accounts Payable (Creditors)"
      subtitle="Outstanding liabilities owed to food suppliers, gas vendors, packaging and operational services"
      breadcrumbs={[
        { label: 'Financial Accounts', href: '/accounts/chart-of-accounts' },
        { label: 'Accounts Payable' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Icons.Printer size={15} />
            <span>Print Report</span>
          </Button>
          <Link href="/vouchers/cpv">
            <Button variant="primary" size="sm">
              <Icons.Plus size={15} />
              <span>Record Payment (CPV)</span>
            </Button>
          </Link>
        </div>
      }
    >
      {/* Top Total Banner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="sm:col-span-2 p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <span className="text-[12px] text-[#64748B] uppercase tracking-wider font-semibold">
            Total Accounts Payable Liability
          </span>
          <div className="mt-2">
            <p className="text-3xl font-bold font-mono tabular-nums text-[#C2410C]">
              {formatCurrency(vendorBalances.totalPayable)}
            </p>
            <p className="text-[13px] text-[#64748B] mt-1.5 flex items-center gap-1.5">
              <Icons.CheckCircle size={14} className="text-[#0F766E]" />
              <span>Reconciled with GL Account #201900 & Balance Sheet</span>
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <span className="text-[12px] text-[#64748B] uppercase tracking-wider font-semibold">
            Pending Creditor Accounts
          </span>
          <div className="mt-2">
            <p className="text-3xl font-bold font-mono tabular-nums text-[#172554]">
              {payableVendors.length} <span className="text-base font-normal text-[#64748B]">Suppliers</span>
            </p>
            <p className="text-[13px] text-[#64748B] mt-1.5">
              Suppliers with outstanding unpaid bills
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative w-full sm:w-96">
            <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
            <input
              type="text"
              placeholder="Search by vendor name or account number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* AP Schedule Table */}
      <Card>
        {payableVendors.length === 0 ? (
          <EmptyState
            icon="CreditCard"
            title="No Outstanding Accounts Payable"
            description={search ? "No creditors match your search criteria." : "All supplier balances are settled or no credit bills are currently unpaid."}
            actionLabel="View Purchase Invoices"
            actionHref="/purchases"
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Account No</TableHead>
                  <TableHead>Vendor / Supplier Name</TableHead>
                  <TableHead className="text-right">Total Debit (Paid)</TableHead>
                  <TableHead className="text-right">Total Credit (Billed)</TableHead>
                  <TableHead className="text-right">Payable Balance (PKR)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {payableVendors.map((vendor) => (
                  <TableRow key={vendor.vendorId}>
                    <TableCell className="font-mono font-bold text-[#172554] text-[13px]">
                      {vendor.accountNo}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-[#172554] text-[14px]">{vendor.name}</p>
                      <p className="text-[12px] text-[#64748B]">{vendor.category}</p>
                    </TableCell>
                    <TableCell className="text-right font-mono text-[13px] tabular-nums text-[#047857]">
                      {formatCurrency(vendor.totalDebit)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[13px] tabular-nums text-[#64748B]">
                      {formatCurrency(vendor.totalCredit)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-[14px] tabular-nums text-[#C2410C]">
                      {formatCurrency(vendor.netPayable)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/accounts/vendor-ledger?vendorId=${vendor.vendorId}`}>
                          <Button variant="outline" size="sm">
                            <Icons.BookOpen size={13} />
                            <span>Statement</span>
                          </Button>
                        </Link>
                        <Link href={`/vouchers/cpv?vendorId=${vendor.vendorId}`}>
                          <Button variant="primary" size="sm">
                            <Icons.ArrowUpRight size={13} />
                            <span>Pay Bill</span>
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center text-[13px] font-bold text-[#334155]">
              <span>Total Payable to Creditors:</span>
              <span className="text-[#C2410C] font-mono text-base tabular-nums">
                {formatCurrency(vendorBalances.totalPayable)}
              </span>
            </div>
          </>
        )}
      </Card>
    </PageContainer>
  );
}
