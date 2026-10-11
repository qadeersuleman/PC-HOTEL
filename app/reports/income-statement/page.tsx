'use client';

import React, { useState, useMemo } from 'react';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { generateIncomeStatement } from '../../../lib/accounting/financial-statements';
import { formatCurrency } from '../../../lib/utils/formatters';

export default function IncomeStatementPage() {
  const { accounts, journalEntries } = useERPStorage();
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-10-31');

  const report = useMemo(() => {
    return generateIncomeStatement(accounts, journalEntries, startDate, endDate);
  }, [accounts, journalEntries, startDate, endDate]);

  return (
    <PageContainer
      title="Final Income Statement (Profit & Loss)"
      subtitle="GT Road Cafe Taj — Revenue, Cost of Goods Sold (COGS), Gross Margin, and Net Operating Income"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Icons.Printer size={14} />
            <span>Print P&L</span>
          </Button>
        </div>
      }
    >
      {/* Date Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Reporting Accounting Period:
          </span>
          <div className="flex items-center gap-2">
            <div>
              <span className="text-[11px] text-zinc-400 mr-2">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <span className="text-[11px] text-zinc-400 mr-2">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4 Summary Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Revenue</span>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
            {formatCurrency(report.revenue.totalRevenue)}
          </p>
          <span className="text-[11px] text-zinc-400">Dine-in + Takeaway sales</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Cost of Goods Sold (COGS)</span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(report.cogs.totalCogs)}
          </p>
          <span className="text-[11px] text-zinc-400">Kitchen consumption issues</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Gross Profit</span>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
            {formatCurrency(report.grossProfit)}
          </p>
          <span className="text-[11px] font-semibold text-teal-600">Margin: {report.grossProfitMargin}%</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Net Profit</span>
          <p className={`text-2xl font-bold mt-1 ${report.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
            {formatCurrency(report.netProfit)}
          </p>
          <span className="text-[11px] font-semibold text-emerald-600">Net Margin: {report.netProfitMargin}%</span>
        </Card>
      </div>

      {/* Detailed P&L Statement */}
      <Card>
        <CardHeader>
          <CardTitle>Income Statement Breakdown</CardTitle>
          <p className="text-xs text-zinc-500">
            Purchases recorded as store inventory are not double-expensed. Only culinary issues and operating consumption are recognized on this P&L.
          </p>
        </CardHeader>
        <div className="p-6 space-y-6 text-sm">
          {/* 1. REVENUE SECTION */}
          <div>
            <div className="flex justify-between font-bold text-zinc-900 dark:text-zinc-100 border-b pb-2">
              <span className="uppercase tracking-wider text-xs">1. Operating Revenue</span>
              <span className="font-mono">{formatCurrency(report.revenue.totalRevenue)}</span>
            </div>
            <div className="py-2.5 px-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Restaurant Food & Beverage Sales (400100)</span>
                <span className="font-mono">{formatCurrency(report.revenue.restaurantSales)}</span>
              </div>
              {report.revenue.otherIncome > 0 && (
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Other Operating Income (400200)</span>
                  <span className="font-mono">{formatCurrency(report.revenue.otherIncome)}</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. COGS SECTION (Modeled after image 1) */}
          <div>
            <div className="flex justify-between font-bold text-amber-800 dark:text-amber-400 border-b pb-2">
              <span className="uppercase tracking-wider text-xs">2. Cost of Goods Sold (Direct Kitchen Cost)</span>
              <span className="font-mono">-{formatCurrency(report.cogs.totalCogs)}</span>
            </div>
            <div className="py-2.5 px-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Kitchen Food Ingredient Consumption (500100)</span>
                <span className="font-mono">-{formatCurrency(report.cogs.kitchenConsumption)}</span>
              </div>
              {report.cogs.wastageAndSpoilage > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>Kitchen Spoilage & Wastage Loss (600900)</span>
                  <span className="font-mono">-{formatCurrency(report.cogs.wastageAndSpoilage)}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. GROSS PROFIT SUB-TOTAL */}
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 flex justify-between items-center font-bold">
            <div>
              <span className="text-zinc-900 dark:text-zinc-100">GROSS PROFIT</span>
              <span className="text-xs text-zinc-500 ml-2 font-normal">(Net Sales - COGS)</span>
            </div>
            <span className="font-mono text-base text-teal-600 dark:text-teal-400">
              {formatCurrency(report.grossProfit)}
            </span>
          </div>

          {/* 4. OPERATING EXPENSES SECTION */}
          <div>
            <div className="flex justify-between font-bold text-rose-800 dark:text-rose-400 border-b pb-2">
              <span className="uppercase tracking-wider text-xs">3. Operating Expenses</span>
              <span className="font-mono">-{formatCurrency(report.totalOperatingExpenses)}</span>
            </div>
            <div className="py-2.5 px-4 space-y-1.5 text-xs">
              {report.operatingExpenses.length === 0 ? (
                <p className="text-zinc-400">No general operating expenses recorded for period.</p>
              ) : (
                report.operatingExpenses.map((exp, idx) => (
                  <div key={idx} className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>{exp.category}</span>
                    <span className="font-mono">-{formatCurrency(exp.amount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 5. NET PROFIT GRAND TOTAL */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex justify-between items-center font-bold text-base">
            <div>
              <span className="text-emerald-900 dark:text-emerald-100">FINAL NET PROFIT / (LOSS)</span>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 block font-normal mt-0.5">
                Gross Profit - Operating Expenses
              </span>
            </div>
            <span className="font-mono text-xl text-emerald-600 dark:text-emerald-400">
              {formatCurrency(report.netProfit)}
            </span>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
