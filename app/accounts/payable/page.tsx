'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
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
      subtitle="GT Road Cafe Taj — Outstanding liabilities owed to food suppliers, gas vendors, and services"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Icons.Printer size={14} />
            <span>Print Statement</span>
          </Button>
          <Link href="/vouchers/cpv">
            <Button variant="primary" size="sm">
              <Icons.Plus size={14} />
              <span>Record Payment (CPV)</span>
            </Button>
          </Link>
        </div>
      }
    >
      {/* Top Total Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 sm:col-span-2">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Accounts Payable</span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(vendorBalances.totalPayable)}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Reconciles with Account 201900 in General Ledger & Balance Sheet
          </p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Active Creditor Accounts</span>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
            {payableVendors.length} Suppliers
          </p>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative w-full sm:w-80">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search by vendor name or account number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* AP Table exactly modeled after the user's uploaded screenshot */}
      <Card>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Account No</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead className="text-right">Debit (PKR)</TableHead>
              <TableHead className="text-right">Credit (PKR)</TableHead>
              <TableHead className="text-right">Payable Amount (PKR)</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {payableVendors.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-zinc-400 text-xs">
                  No outstanding accounts payable found.
                </td>
              </tr>
            ) : (
              payableVendors.map((vendor) => (
                <TableRow key={vendor.vendorId}>
                  <TableCell className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {vendor.accountNo}
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{vendor.name}</p>
                    <p className="text-[11px] text-zinc-400">{vendor.category}</p>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {formatCurrency(vendor.totalDebit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {formatCurrency(vendor.totalCredit)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                    {formatCurrency(vendor.netPayable)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/accounts/vendor-ledger?vendorId=${vendor.vendorId}`}
                        className="text-xs text-zinc-600 hover:text-emerald-600 font-semibold"
                      >
                        Ledger
                      </Link>
                      <Link
                        href={`/vouchers/cpv?vendorId=${vendor.vendorId}`}
                        className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100"
                      >
                        Pay
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-between items-center text-xs font-bold">
          <span>Total Amount:</span>
          <span className="text-amber-600 dark:text-amber-400 text-sm">
            {formatCurrency(vendorBalances.totalPayable)}
          </span>
        </div>
      </Card>
    </PageContainer>
  );
}
