'use client';

import React, { useState, useMemo } from 'react';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
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
      subtitle="Statement of Assets, Liabilities, and Owner's Equity for GT Road Cafe Taj"
      breadcrumbs={[
        { label: 'Financial Reports' },
        { label: 'Balance Sheet' },
      ]}
      actions={
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Icons.Printer size={15} />
          <span>Print Balance Sheet</span>
        </Button>
      }
    >
      {/* Date Filter & Status Banner */}
      <Card>
        <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-[#172554]">As of Effective Date:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="h-10 px-3 text-[13px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>

          <div>
            {balanceSheet.isBalanced ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                <Icons.CheckCircle size={15} className="text-[#047857]" />
                <span>Accounting Equation Balanced (Assets = Liabilities + Equity)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
                <Icons.AlertTriangle size={15} className="text-[#B91C1C]" />
                <span>Equation Discrepancy: {formatCurrency(balanceSheet.difference)}</span>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side Assets vs Liabilities & Equity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ASSETS SECTION */}
        <Card>
          <CardHeader className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-bold text-[#172554]">TOTAL ASSETS</CardTitle>
              <span className="font-mono font-bold text-xl text-[#0F766E]">
                {formatCurrency(balanceSheet.assets.totalAssets)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <h4 className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider">
              Current & Liquid Assets
            </h4>
            <div className="space-y-2.5 text-[13px]">
              {balanceSheet.assets.currentAssets.map((asset, idx) => (
                <div key={idx} className="flex justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div>
                    <span className="font-semibold text-[#172554]">{asset.accountName}</span>
                    <span className="font-mono text-[#64748B] ml-2 text-[12px]">({asset.code})</span>
                  </div>
                  <span className="font-mono font-bold text-[#172554]">
                    {formatCurrency(asset.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex justify-between items-center font-bold text-[14px]">
              <span className="text-[#334155]">Total Current Assets:</span>
              <span className="font-mono text-base text-[#0F766E]">
                {formatCurrency(balanceSheet.assets.totalCurrentAssets)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* LIABILITIES & EQUITY SECTION */}
        <Card>
          <CardHeader className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-bold text-[#172554]">
                TOTAL LIABILITIES &amp; EQUITY
              </CardTitle>
              <span className="font-mono font-bold text-xl text-[#172554]">
                {formatCurrency(balanceSheet.liabilities.totalLiabilities + balanceSheet.equity.totalEquity)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {/* Liabilities */}
            <div>
              <h4 className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider mb-2.5">
                Current Liabilities (Payables)
              </h4>
              <div className="space-y-2 text-[13px]">
                {balanceSheet.liabilities.currentLiabilities.map((liab, idx) => (
                  <div key={idx} className="flex justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div>
                      <span className="font-semibold text-[#172554]">{liab.accountName}</span>
                      <span className="font-mono text-[#64748B] ml-2 text-[12px]">({liab.code})</span>
                    </div>
                    <span className="font-mono font-bold text-[#C2410C]">
                      {formatCurrency(liab.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-3 flex justify-between text-[13px] font-semibold text-[#334155]">
                <span>Total Liabilities:</span>
                <span className="font-mono font-bold text-[#C2410C]">{formatCurrency(balanceSheet.liabilities.totalLiabilities)}</span>
              </div>
            </div>

            {/* Equity */}
            <div className="pt-4 border-t border-[#E2E8F0]">
              <h4 className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider mb-2.5">
                Owner&apos;s Equity & Net Earnings
              </h4>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="font-semibold text-[#172554]">Owner&apos;s Capital Investment (#300100)</span>
                  <span className="font-mono font-bold text-[#172554]">
                    {formatCurrency(balanceSheet.equity.ownersCapital)}
                  </span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0]">
                  <div>
                    <span className="font-semibold text-[#065F46]">Retained Net Earnings</span>
                    <span className="text-[11px] text-[#047857] ml-2 font-normal">(from Income Statement)</span>
                  </div>
                  <span className="font-mono font-bold text-[#047857]">
                    {formatCurrency(balanceSheet.equity.currentPeriodProfit)}
                  </span>
                </div>
              </div>
              <div className="pt-3 flex justify-between text-[13px] font-semibold text-[#334155]">
                <span>Total Owner&apos;s Equity:</span>
                <span className="font-mono font-bold text-[#047857]">{formatCurrency(balanceSheet.equity.totalEquity)}</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="pt-4 border-t-2 border-[#172554] flex justify-between items-center font-bold text-[14px]">
              <span className="text-[#172554]">Total Liabilities + Equity:</span>
              <span className="font-mono text-base text-[#172554]">
                {formatCurrency(balanceSheet.liabilities.totalLiabilities + balanceSheet.equity.totalEquity)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
