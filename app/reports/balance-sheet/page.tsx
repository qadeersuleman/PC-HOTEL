'use client';

import React, { useState, useMemo } from 'react';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { generateBalanceSheet } from '../../../lib/accounting/financial-statements';
import { formatCurrency, getTodayDateString } from '../../../lib/utils/formatters';

export default function BalanceSheetPage() {
  const { accounts, journalEntries } = useERPStorage();
  const [asOfDate, setAsOfDate] = useState(getTodayDateString());

  const balanceSheet = useMemo(() => {
    return generateBalanceSheet(accounts, journalEntries, asOfDate);
  }, [accounts, journalEntries, asOfDate]);

  return (
    <PageContainer
      title="Balance Sheet (Financial Position)"
      subtitle="GT Road Cafe Taj — Statement of Assets, Liabilities, and Owner's Equity"
      actions={
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Icons.Printer size={14} />
          <span>Print Balance Sheet</span>
        </Button>
      }
    >
      {/* Date Filter & Status Banner */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">As of Date:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>

          <div>
            {balanceSheet.isBalanced ? (
              <Badge variant="success" className="px-3 py-1 text-xs">
                ✓ Balance Sheet Verified (Assets = Liabilities + Equity)
              </Badge>
            ) : (
              <Badge variant="danger" className="px-3 py-1 text-xs">
                ⚠ Equation Discrepancy: {formatCurrency(balanceSheet.difference)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side or stacked Assets vs Liabilities & Equity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ASSETS SECTION */}
        <Card>
          <CardHeader className="bg-sky-50/50 dark:bg-sky-950/20 border-b border-sky-100 dark:border-sky-900/40">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sky-950 dark:text-sky-200">TOTAL ASSETS</CardTitle>
              <span className="font-mono font-bold text-lg text-sky-700 dark:text-sky-300">
                {formatCurrency(balanceSheet.assets.totalAssets)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Current Assets
            </h4>
            <div className="space-y-2.5 text-xs">
              {balanceSheet.assets.currentAssets.map((asset, idx) => (
                <div key={idx} className="flex justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                  <div>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{asset.accountName}</span>
                    <span className="font-mono text-zinc-400 ml-2">({asset.code})</span>
                  </div>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(asset.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center font-bold text-sm">
              <span>Total Current Assets:</span>
              <span className="font-mono text-sky-600 dark:text-sky-400">
                {formatCurrency(balanceSheet.assets.totalCurrentAssets)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* LIABILITIES & EQUITY SECTION */}
        <Card>
          <CardHeader className="bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/40">
            <div className="flex justify-between items-center">
              <CardTitle className="text-amber-950 dark:text-amber-200">
                LIABILITIES &amp; OWNER&apos;S EQUITY
              </CardTitle>
              <span className="font-mono font-bold text-lg text-amber-700 dark:text-amber-300">
                {formatCurrency(balanceSheet.liabilities.totalLiabilities + balanceSheet.equity.totalEquity)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            {/* Liabilities */}
            <div>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                Current Liabilities
              </h4>
              <div className="space-y-2 text-xs">
                {balanceSheet.liabilities.currentLiabilities.map((liab, idx) => (
                  <div key={idx} className="flex justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                    <div>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{liab.accountName}</span>
                      <span className="font-mono text-zinc-400 ml-2">({liab.code})</span>
                    </div>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(liab.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 flex justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                <span>Total Liabilities:</span>
                <span className="font-mono">{formatCurrency(balanceSheet.liabilities.totalLiabilities)}</span>
              </div>
            </div>

            {/* Equity */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                Owner&apos;s Equity
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">Owner&apos;s Capital (300100)</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(balanceSheet.equity.ownersCapital)}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                  <div>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">Current Period Net Profit</span>
                    <span className="text-[10px] text-zinc-400 ml-1.5">(from P&L)</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(balanceSheet.equity.currentPeriodProfit)}
                  </span>
                </div>
              </div>
              <div className="pt-2 flex justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                <span>Total Equity:</span>
                <span className="font-mono">{formatCurrency(balanceSheet.equity.totalEquity)}</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center font-bold text-sm">
              <span>Total Liabilities + Equity:</span>
              <span className="font-mono text-amber-600 dark:text-amber-400">
                {formatCurrency(balanceSheet.liabilities.totalLiabilities + balanceSheet.equity.totalEquity)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
