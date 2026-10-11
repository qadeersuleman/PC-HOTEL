'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
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
      subtitle="GT Road Cafe Taj — Customer credit ledgers, staff advances, and supplier advance balances"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Icons.Printer size={14} />
            <span>Print Statement</span>
          </Button>
          <Link href="/vouchers/crv">
            <Button variant="primary" size="sm">
              <Icons.Plus size={14} />
              <span>Record Receipt (CRV)</span>
            </Button>
          </Link>
        </div>
      }
    >
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Customer Accounts Receivable</span>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {formatCurrency(customerBalances.totalReceivable)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Guest & Corporate receivables (Account 100500)</p>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Vendor Advances (Supplier Debit)</span>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {formatCurrency(vendorBalances.totalAdvances)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Excess payments / advance deposits with vendors</p>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Consolidated Debit Assets</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(combinedTotal)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Total debit balances across all parties</p>
        </Card>
      </div>

      {/* Tab Switcher & Search */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('SEPARATED')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'SEPARATED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              Classified View (GAAP Standards)
            </button>
            <button
              onClick={() => setActiveTab('CONSOLIDATED')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'CONSOLIDATED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              Consolidated Statement (Hotel Legacy Format)
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Render Based on Tab */}
      {activeTab === 'SEPARATED' ? (
        <div className="space-y-6">
          {/* Section 1: Real Customer Receivables */}
          <Card>
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  Customer & Employee Receivables
                </h3>
                <p className="text-xs text-zinc-400">Credit extended to dining guests, banquets, and staff</p>
              </div>
              <Badge variant="info">Asset Account 100500</Badge>
            </div>
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Account No</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Receivable Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((cust) => (
                  <TableRow key={cust.customerId}>
                    <TableCell className="font-mono font-bold">{cust.accountNo}</TableCell>
                    <TableCell>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{cust.name}</p>
                      <p className="text-[11px] text-zinc-400">{cust.category}</p>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatCurrency(cust.totalDebit)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatCurrency(cust.totalCredit)}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {formatCurrency(cust.netReceivable)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/accounts/customer-ledger?customerId=${cust.customerId}`}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        View Ledger
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-between items-center text-xs font-bold">
              <span>Total Customer Receivables:</span>
              <span className="text-blue-600 dark:text-blue-400">{formatCurrency(customerBalances.totalReceivable)}</span>
            </div>
          </Card>

          {/* Section 2: Vendor Advances */}
          <Card>
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  Vendor Advances (Supplier Debit Balances)
                </h3>
                <p className="text-xs text-zinc-400">
                  Prepayments, security deposits, and overpayments held with vendors
                </p>
              </div>
              <Badge variant="purple">Asset Account 100700</Badge>
            </div>
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Account No</TableHead>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Advance Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {filteredVendorAdvances.map((ven) => (
                  <TableRow key={ven.vendorId}>
                    <TableCell className="font-mono font-bold">{ven.accountNo}</TableCell>
                    <TableCell>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{ven.name}</p>
                      <p className="text-[11px] text-zinc-400">{ven.category}</p>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatCurrency(ven.totalDebit)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatCurrency(ven.totalCredit)}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-purple-600 dark:text-purple-400 text-sm">
                      {formatCurrency(ven.advanceAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/accounts/vendor-ledger?vendorId=${ven.vendorId}`}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        View Ledger
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-between items-center text-xs font-bold">
              <span>Total Vendor Advances:</span>
              <span className="text-purple-600 dark:text-purple-400">{formatCurrency(vendorBalances.totalAdvances)}</span>
            </div>
          </Card>
        </div>
      ) : (
        /* Consolidated View matching Image 4 */
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
                  <TableCell className="font-mono font-bold">{c.accountNo}</TableCell>
                  <TableCell className="font-semibold">{c.name}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatCurrency(c.totalDebit)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatCurrency(c.totalCredit)}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-xs">{formatCurrency(c.netReceivable)}</TableCell>
                </TableRow>
              ))}
              {filteredVendorAdvances.map((v) => (
                <TableRow key={v.vendorId}>
                  <TableCell className="font-mono font-bold">{v.accountNo}</TableCell>
                  <TableCell className="font-semibold">{v.name}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatCurrency(v.totalDebit)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatCurrency(v.totalCredit)}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-xs">{formatCurrency(v.advanceAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-between items-center text-xs font-bold">
            <span>Total Amount:</span>
            <span className="text-emerald-600 dark:text-emerald-400 text-sm">
              {formatCurrency(combinedTotal)}
            </span>
          </div>
        </Card>
      )}
    </PageContainer>
  );
}

