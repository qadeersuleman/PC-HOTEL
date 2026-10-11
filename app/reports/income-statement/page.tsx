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

  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');

  const report = useMemo(() => {
    return generateIncomeStatement(accounts, journalEntries, startDate, endDate);
  }, [accounts, journalEntries, startDate, endDate]);

  return (
    <PageContainer
      title="Final Income Statement (Profit & Loss)"
      subtitle="Operating revenue, direct kitchen culinary consumption (COGS), gross margins, and net operating profit"
      breadcrumbs={[
        { label: 'Financial Reports' },
        { label: 'Income Statement' },
      ]}
      actions={
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Icons.Printer size={15} />
          <span>Print P&L Statement</span>
        </Button>
      }
    >
      {/* Date Filter Bar */}
      <Card>
        <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[14px] font-bold text-[#172554] block">
              Reporting Accounting Period
            </span>
            <p className="text-[12px] text-[#64748B]">Accrual-based financial statement derived from double-entry GL</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-[#64748B]">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 px-3 text-[13px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-[#64748B]">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 px-3 text-[13px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4 Summary Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <span className="text-[12px] text-[#64748B] uppercase tracking-wider font-semibold">Total Revenue</span>
          <div className="mt-2">
            <p className="text-3xl font-bold font-mono tabular-nums text-[#172554]">
              {formatCurrency(report.revenue.totalRevenue)}
            </p>
            <p className="text-[12px] text-[#64748B] mt-1">Dine-in + Takeaway + Catering</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <span className="text-[12px] text-[#64748B] uppercase tracking-wider font-semibold">Cost of Goods Sold (COGS)</span>
          <div className="mt-2">
            <p className="text-3xl font-bold font-mono tabular-nums text-[#C2410C]">
              {formatCurrency(report.cogs.totalCogs)}
            </p>
            <p className="text-[12px] text-[#64748B] mt-1">Kitchen food consumption issues</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <span className="text-[12px] text-[#64748B] uppercase tracking-wider font-semibold">Gross Profit Margin</span>
          <div className="mt-2">
            <p className="text-3xl font-bold font-mono tabular-nums text-[#0F766E]">
              {formatCurrency(report.grossProfit)}
            </p>
            <p className="text-[12px] font-bold text-[#0F766E] mt-1">Gross Margin: {report.grossProfitMargin}%</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <span className="text-[12px] text-[#64748B] uppercase tracking-wider font-semibold">Net Operating Profit</span>
          <div className="mt-2">
            <p className={`text-3xl font-bold font-mono tabular-nums ${report.netProfit >= 0 ? 'text-[#047857]' : 'text-[#B91C1C]'}`}>
              {formatCurrency(report.netProfit)}
            </p>
            <p className={`text-[12px] font-bold mt-1 ${report.netProfit >= 0 ? 'text-[#047857]' : 'text-[#B91C1C]'}`}>
              Net Margin: {report.netProfitMargin}%
            </p>
          </div>
        </div>
      </div>

      {/* Detailed P&L Statement Structure */}
      <Card>
        <CardHeader className="border-b border-[#E2E8F0] bg-[#F8FAFC]/50 p-6">
          <CardTitle className="text-lg font-bold text-[#172554]">Official Profit & Loss Statement</CardTitle>
          <p className="text-[13px] text-[#64748B] mt-1">
            Store inventory purchases are capitalized as assets and not double-expensed. Only culinary kitchen store issues and operational station consumptions are matched on this P&L.
          </p>
        </CardHeader>
        <div className="p-6 space-y-6 text-[14px]">
          {/* 1. REVENUE SECTION */}
          <div>
            <div className="flex justify-between font-bold text-[#172554] border-b border-[#E2E8F0] pb-2 text-[15px]">
              <span className="uppercase tracking-wider text-[12px]">1. OPERATING REVENUE</span>
              <span className="font-mono text-[#172554]">{formatCurrency(report.revenue.totalRevenue)}</span>
            </div>
            <div className="py-3 px-4 space-y-2 text-[13px]">
              <div className="flex justify-between text-[#334155]">
                <span>Food & Beverage Dining Sales (#400100)</span>
                <span className="font-mono font-semibold">{formatCurrency(report.revenue.restaurantSales)}</span>
              </div>
              {report.revenue.otherIncome > 0 && (
                <div className="flex justify-between text-[#334155]">
                  <span>Other Operating Revenue (#400200)</span>
                  <span className="font-mono font-semibold">{formatCurrency(report.revenue.otherIncome)}</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. COGS SECTION */}
          <div>
            <div className="flex justify-between font-bold text-[#C2410C] border-b border-[#E2E8F0] pb-2 text-[15px]">
              <span className="uppercase tracking-wider text-[12px]">2. COST OF GOODS SOLD (DIRECT KITCHEN CONSUMPTION)</span>
              <span className="font-mono">({formatCurrency(report.cogs.totalCogs)})</span>
            </div>
            <div className="py-3 px-4 space-y-2 text-[13px]">
              <div className="flex justify-between text-[#334155]">
                <span>Kitchen Food Ingredient Consumption (#500100)</span>
                <span className="font-mono font-semibold text-[#C2410C]">({formatCurrency(report.cogs.kitchenConsumption)})</span>
              </div>
              {report.cogs.wastageAndSpoilage > 0 && (
                <div className="flex justify-between text-[#B91C1C]">
                  <span>Kitchen Spoilage & Wastage Loss (#600900)</span>
                  <span className="font-mono font-semibold text-[#B91C1C]">({formatCurrency(report.cogs.wastageAndSpoilage)})</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. GROSS PROFIT SUB-TOTAL */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex justify-between items-center font-bold">
            <div>
              <span className="text-[#172554] text-[15px]">GROSS OPERATING PROFIT</span>
              <span className="text-[12px] text-[#64748B] ml-2 font-normal">(Total Revenue − Direct COGS)</span>
            </div>
            <span className="font-mono text-lg text-[#0F766E]">
              {formatCurrency(report.grossProfit)}
            </span>
          </div>

          {/* 4. OPERATING EXPENSES SECTION */}
          <div>
            <div className="flex justify-between font-bold text-[#B91C1C] border-b border-[#E2E8F0] pb-2 text-[15px]">
              <span className="uppercase tracking-wider text-[12px]">3. OPERATING & ADMINISTRATIVE EXPENSES</span>
              <span className="font-mono">({formatCurrency(report.totalOperatingExpenses)})</span>
            </div>
            <div className="py-3 px-4 space-y-2 text-[13px]">
              {report.operatingExpenses.length === 0 ? (
                <p className="text-[#94A3B8] italic">No general station operating expenses recorded during this period.</p>
              ) : (
                report.operatingExpenses.map((exp, idx) => (
                  <div key={idx} className="flex justify-between text-[#334155]">
                    <span>{exp.category}</span>
                    <span className="font-mono font-semibold text-[#B91C1C]">({formatCurrency(exp.amount)})</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 5. NET PROFIT GRAND TOTAL */}
          <div className="p-5 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex justify-between items-center font-bold">
            <div>
              <span className="text-[#065F46] text-base sm:text-lg">FINAL NET OPERATING PROFIT / (LOSS)</span>
              <span className="text-[12px] text-[#047857] block font-normal mt-0.5">
                Gross Profit − Operating Expenses
              </span>
            </div>
            <span className={`font-mono text-2xl ${report.netProfit >= 0 ? 'text-[#047857]' : 'text-[#B91C1C]'}`}>
              {formatCurrency(report.netProfit)}
            </span>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
