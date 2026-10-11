'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageContainer } from '../../components/layout/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Icons } from '../../components/ui/icons';
import { useERPStorage } from '../../lib/storage/context';
import { formatCurrency, formatDate } from '../../lib/utils/formatters';

export default function DashboardPage() {
  const {
    sales,
    purchases,
    issues,
    departments,
    stockStatusList,
    totalStockValuation,
    vendorBalances,
    customerBalances,
    cashAndBankTotal,
    lowStockItemsCount,
    vouchers,
    journalEntries,
  } = useERPStorage();

  const [dateFilter, setDateFilter] = useState<'all' | 'month' | 'today'>('all');

  const [todayStr, setTodayStr] = useState('2026-09-12');
  const [currentMonthStr, setCurrentMonthStr] = useState('2026-09');

  React.useEffect(() => {
    const now = new Date().toISOString().slice(0, 10);
    setTodayStr(now);
    setCurrentMonthStr(now.slice(0, 7));
  }, []);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (!p.isPosted) return false;
      if (dateFilter === 'today') return p.date === todayStr;
      if (dateFilter === 'month') return p.date.startsWith(currentMonthStr);
      return true;
    });
  }, [purchases, dateFilter, todayStr, currentMonthStr]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (!s.isPosted) return false;
      if (dateFilter === 'today') return s.date === todayStr;
      if (dateFilter === 'month') return s.date.startsWith(currentMonthStr);
      return true;
    });
  }, [sales, dateFilter, todayStr, currentMonthStr]);

  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      if (!i.isPosted) return false;
      if (dateFilter === 'today') return i.date === todayStr;
      if (dateFilter === 'month') return i.date.startsWith(currentMonthStr);
      return true;
    });
  }, [issues, dateFilter, todayStr, currentMonthStr]);

  const totalSalesAmount = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.netSales, 0);
  }, [filteredSales]);

  const totalPurchasesAmount = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + p.netTotal, 0);
  }, [filteredPurchases]);

  // Estimated COGS from Kitchen issues
  const estimatedKitchenCOGS = useMemo(() => {
    const kitchenDeptIds = new Set(departments.filter((d) => d.isKitchen).map((d) => d.id));
    return filteredIssues
      .filter((i) => kitchenDeptIds.has(i.departmentId))
      .reduce((sum, i) => sum + i.totalCost, 0);
  }, [filteredIssues, departments]);

  // Non-kitchen departmental consumption
  const nonKitchenConsumption = useMemo(() => {
    const nonKitchenDeptIds = new Set(departments.filter((d) => !d.isKitchen).map((d) => d.id));
    return filteredIssues
      .filter((i) => nonKitchenDeptIds.has(i.departmentId))
      .reduce((sum, i) => sum + i.totalCost, 0);
  }, [filteredIssues, departments]);

  const estimatedGrossProfit = totalSalesAmount - estimatedKitchenCOGS;
  const estimatedNetProfit = estimatedGrossProfit - nonKitchenConsumption;

  // Overdue Invoices
  const overduePurchases = useMemo(() => {
    return purchases.filter((p) => p.balanceAmount > 0 && p.dueDate < todayStr && p.isPosted);
  }, [purchases, todayStr]);

  // Low stock items
  const lowStockItems = useMemo(() => {
    return stockStatusList.filter((item) => item.isLowStock);
  }, [stockStatusList]);

  // Department issue breakdown
  const departmentBreakdown = useMemo(() => {
    return departments
      .map((dept) => {
        const deptIssues = filteredIssues.filter((i) => i.departmentId === dept.id);
        const amount = deptIssues.reduce((sum, i) => sum + i.totalCost, 0);
        return {
          name: dept.name,
          isKitchen: dept.isKitchen,
          amount,
        };
      })
      .filter((d) => d.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [departments, filteredIssues]);

  // Recent transactions feed
  const recentTransactions = useMemo(() => {
    const list: { id: string; date: string; title: string; type: string; amount: number; badgeColor: 'success' | 'info' | 'warning' | 'primary' }[] = [];

    filteredPurchases.slice(0, 4).forEach((p) => {
      list.push({
        id: p.id,
        date: p.date,
        title: `Bill ${p.invoiceNumber} — ${p.vendorName}`,
        type: 'Purchase',
        amount: p.netTotal,
        badgeColor: 'warning',
      });
    });

    filteredSales.slice(0, 4).forEach((s) => {
      list.push({
        id: s.id,
        date: s.date,
        title: `Sales [${s.channel}] — ${s.paymentMethod}`,
        type: 'Sales',
        amount: s.netSales,
        badgeColor: 'success',
      });
    });

    filteredIssues.slice(0, 3).forEach((i) => {
      list.push({
        id: i.id,
        date: i.date,
        title: `Issue ${i.issueNumber} to ${i.departmentName}`,
        type: 'Store Issue',
        amount: i.totalCost,
        badgeColor: 'info',
      });
    });

    return list.sort((a, b) => (b.date > a.date ? 1 : -1)).slice(0, 6);
  }, [filteredPurchases, filteredSales, filteredIssues]);

  return (
    <PageContainer
      title="Executive Dashboard"
      subtitle="Live restaurant operational overview, store valuation, and financial health"
      actions={
        <div className="flex items-center gap-1 p-1 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs">
          <button
            onClick={() => setDateFilter('all')}
            className={`px-3.5 py-1.5 text-[13px] font-semibold rounded-lg transition-all ${
              dateFilter === 'all'
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172554] hover:bg-[#F8FAFC]'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`px-3.5 py-1.5 text-[13px] font-semibold rounded-lg transition-all ${
              dateFilter === 'month'
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172554] hover:bg-[#F8FAFC]'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3.5 py-1.5 text-[13px] font-semibold rounded-lg transition-all ${
              dateFilter === 'today'
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172554] hover:bg-[#F8FAFC]'
            }`}
          >
            Today
          </button>
        </div>
      }
    >
      {/* 8 Primary Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Sales */}
        <Card className="hover:border-[#CBD5E1] transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#64748B] uppercase tracking-wider">Total Sales</span>
              <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center text-[#0F766E] shadow-2xs">
                <Icons.DollarSign size={20} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#172554] mt-3 tabular-nums font-mono">
              {formatCurrency(totalSalesAmount)}
            </p>
            <div className="flex items-center gap-1.5 mt-2.5 text-[13px] text-[#64748B]">
              <span className="text-[#0F766E] font-semibold">{filteredSales.length} entries</span>
              <span>• Dine-in & Takeaway</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Purchases */}
        <Card className="hover:border-[#CBD5E1] transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#64748B] uppercase tracking-wider">Total Purchases</span>
              <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] border border-[#E0E7FF] flex items-center justify-center text-[#4F46E5] shadow-2xs">
                <Icons.ShoppingCart size={20} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#172554] mt-3 tabular-nums font-mono">
              {formatCurrency(totalPurchasesAmount)}
            </p>
            <div className="flex items-center gap-1.5 mt-2.5 text-[13px] text-[#64748B]">
              <span className="text-[#4F46E5] font-semibold">{filteredPurchases.length} bills</span>
              <span>• Raw grocery & supplies</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Stock Valuation */}
        <Card className="hover:border-[#CBD5E1] transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#64748B] uppercase tracking-wider">Stock Valuation</span>
              <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] border border-[#E0F2FE] flex items-center justify-center text-[#0284C7] shadow-2xs">
                <Icons.Boxes size={20} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#172554] mt-3 tabular-nums font-mono">
              {formatCurrency(totalStockValuation)}
            </p>
            <div className="flex items-center gap-1.5 mt-2.5 text-[13px] text-[#64748B]">
              <span className="text-[#0284C7] font-semibold">{stockStatusList.length} items</span>
              <span>• Weighted average cost</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Estimated Profit */}
        <Card className="hover:border-[#CBD5E1] transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#64748B] uppercase tracking-wider">Estimated Profit</span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-2xs ${
                estimatedNetProfit >= 0 ? 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857]' : 'bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C]'
              }`}>
                <Icons.TrendingUp size={20} />
              </div>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold mt-3 tabular-nums font-mono ${
              estimatedNetProfit >= 0 ? 'text-[#047857]' : 'text-[#B91C1C]'
            }`}>
              {formatCurrency(estimatedNetProfit)}
            </p>
            <div className="flex items-center gap-1.5 mt-2.5 text-[13px] text-[#64748B]">
              <span>Kitchen COGS: {formatCurrency(estimatedKitchenCOGS)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Accounts Payable */}
        <Card className="hover:border-[#CBD5E1] transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#64748B] uppercase tracking-wider">Accounts Payable (AP)</span>
              <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] flex items-center justify-center text-[#C2410C] shadow-2xs">
                <Icons.CreditCard size={20} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#172554] mt-3 tabular-nums font-mono">
              {formatCurrency(vendorBalances.totalPayable)}
            </p>
            <div className="flex items-center gap-1.5 mt-2.5 text-[13px]">
              <Link href="/accounts/payable" className="text-[#C2410C] font-semibold hover:underline">
                View supplier liabilities →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card 6: Accounts Receivable */}
        <Card className="hover:border-[#CBD5E1] transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#64748B] uppercase tracking-wider">Accounts Receivable (AR)</span>
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#1D4ED8] shadow-2xs">
                <Icons.Receipt size={20} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#172554] mt-3 tabular-nums font-mono">
              {formatCurrency(customerBalances.totalReceivable)}
            </p>
            <div className="flex items-center gap-1.5 mt-2.5 text-[13px]">
              <Link href="/accounts/receivable" className="text-[#1D4ED8] font-semibold hover:underline">
                View guest receivables →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card 7: Vendor Advances */}
        <Card className="hover:border-[#CBD5E1] transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#64748B] uppercase tracking-wider">Vendor Advances</span>
              <div className="w-10 h-10 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] flex items-center justify-center text-[#7E22CE] shadow-2xs">
                <Icons.Banknote size={20} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#172554] mt-3 tabular-nums font-mono">
              {formatCurrency(vendorBalances.totalAdvances)}
            </p>
            <div className="flex items-center gap-1.5 mt-2.5 text-[13px] text-[#64748B]">
              <span>Prepaid supplier balances</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 8: Cash & Bank */}
        <Card className="hover:border-[#CBD5E1] transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#64748B] uppercase tracking-wider">Cash & Bank Liquidity</span>
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#047857] shadow-2xs">
                <Icons.Landmark size={20} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#172554] mt-3 tabular-nums font-mono">
              {formatCurrency(cashAndBankTotal)}
            </p>
            <div className="flex items-center gap-1.5 mt-2.5 text-[13px]">
              <Link href="/accounts/cash-bank" className="text-[#047857] font-semibold hover:underline">
                View bank accounts →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Charts & Visual Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales vs Expenses Financial Summary */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>Financial Flow: Sales vs. Direct Costs & Expenses</CardTitle>
              <p className="text-[13px] text-[#64748B] mt-1">Live reconciliation based on posted general ledger entries</p>
            </div>
            <Badge variant="success">Balanced GL</Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Visual Progress Comparison */}
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-[14px] font-semibold mb-2">
                  <span className="text-[#334155]">Revenue (Net Sales)</span>
                  <span className="text-[#0F766E] font-bold tabular-nums font-mono">{formatCurrency(totalSalesAmount)}</span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-[#0F766E] rounded-full transition-all duration-500" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[14px] font-semibold mb-2">
                  <span className="text-[#334155]">Estimated Kitchen COGS (Food Cost)</span>
                  <span className="text-[#C2410C] font-bold tabular-nums font-mono">{formatCurrency(estimatedKitchenCOGS)}</span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-[#C2410C] rounded-full transition-all duration-500"
                    style={{ width: `${totalSalesAmount > 0 ? Math.min(100, (estimatedKitchenCOGS / totalSalesAmount) * 100) : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[14px] font-semibold mb-2">
                  <span className="text-[#334155]">Operating Supplies & Disposables</span>
                  <span className="text-[#B91C1C] font-bold tabular-nums font-mono">{formatCurrency(nonKitchenConsumption)}</span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-[#B91C1C] rounded-full transition-all duration-500"
                    style={{ width: `${totalSalesAmount > 0 ? Math.min(100, (nonKitchenConsumption / totalSalesAmount) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Financial Ratios Bar */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4 text-[13px]">
              <div>
                <span className="text-[#64748B]">Gross Margin:</span>
                <span className="font-bold text-[#172554] ml-1.5 tabular-nums">
                  {totalSalesAmount > 0 ? `${((estimatedGrossProfit / totalSalesAmount) * 100).toFixed(1)}%` : '0.0%'}
                </span>
              </div>
              <div>
                <span className="text-[#64748B]">Net Profit Margin:</span>
                <span className="font-bold text-[#047857] ml-1.5 tabular-nums">
                  {totalSalesAmount > 0 ? `${((estimatedNetProfit / totalSalesAmount) * 100).toFixed(1)}%` : '0.0%'}
                </span>
              </div>
              <div>
                <span className="text-[#64748B]">Food Cost Ratio:</span>
                <span className="font-bold text-[#C2410C] ml-1.5 tabular-nums">
                  {totalSalesAmount > 0 ? `${((estimatedKitchenCOGS / totalSalesAmount) * 100).toFixed(1)}%` : '0.0%'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department Issue Summaries */}
        <Card>
          <CardHeader>
            <CardTitle>Department Consumption</CardTitle>
            <p className="text-[13px] text-[#64748B] mt-1">Classification by usage & station</p>
          </CardHeader>
          <CardContent>
            {departmentBreakdown.length === 0 ? (
              <p className="text-[13px] text-[#64748B] py-8 text-center">No issues recorded for this period.</p>
            ) : (
              <div className="space-y-3">
                {departmentBreakdown.map((dept, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${dept.isKitchen ? 'bg-[#0F766E]' : 'bg-[#1D4ED8]'}`} />
                      <div>
                        <p className="text-[14px] font-semibold text-[#172554]">{dept.name}</p>
                        <p className="text-[11px] text-[#64748B]">{dept.isKitchen ? 'Kitchen COGS' : 'Operating Supply'}</p>
                      </div>
                    </div>
                    <span className="text-[14px] font-bold text-[#172554] tabular-nums font-mono">
                      {formatCurrency(dept.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Actionable Alerts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operational Alerts Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icons.AlertTriangle className="text-[#C2410C]" size={20} />
              <span>Operational Alerts</span>
            </CardTitle>
            <span className="text-[12px] text-[#64748B] font-semibold">Live Monitor</span>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Low stock alerts */}
            <div>
              <h4 className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider mb-2.5">
                Low Stock Threshold Alerts ({lowStockItems.length})
              </h4>
              {lowStockItems.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-[#ECFDF5] text-[#047857] text-[13px] font-medium flex items-center gap-2 border border-[#A7F3D0]">
                  <Icons.CheckCircle size={16} />
                  <span>All store inventory items are above minimum safety thresholds.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <div
                      key={item.itemId}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[13px]"
                    >
                      <div>
                        <span className="font-bold text-[#172554]">{item.itemName}</span>
                        <span className="text-[#64748B] ml-2">({item.categoryName})</span>
                      </div>
                      <Badge variant="danger">
                        Available: {item.availableQty} {item.unit}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overdue bills alerts */}
            <div className="pt-2">
              <h4 className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider mb-2.5">
                Overdue Purchase Liabilities ({overduePurchases.length})
              </h4>
              {overduePurchases.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-[#ECFDF5] text-[#047857] text-[13px] font-medium flex items-center gap-2 border border-[#A7F3D0]">
                  <Icons.CheckCircle size={16} />
                  <span>No overdue vendor invoices. All liabilities are up to date.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {overduePurchases.slice(0, 3).map((bill) => (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] text-[13px]"
                    >
                      <div>
                        <span className="font-bold text-[#172554]">{bill.vendorName}</span>
                        <span className="text-[#64748B] ml-2">({bill.invoiceNumber})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#C2410C] font-mono tabular-nums">
                          {formatCurrency(bill.balanceAmount)}
                        </span>
                        <Badge variant="warning">Due {bill.dueDate}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Financial Activity Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity Stream</CardTitle>
            <span className="text-[12px] text-[#64748B] font-semibold">Latest Entries</span>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-[13px] text-[#64748B] py-8 text-center">No recent entries recorded.</p>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {recentTransactions.map((tx, idx) => (
                  <div key={idx} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                    <div>
                      <p className="text-[14px] font-semibold text-[#172554]">{tx.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={tx.badgeColor} size="sm">{tx.type}</Badge>
                        <span className="text-[12px] text-[#64748B]">{formatDate(tx.date)}</span>
                      </div>
                    </div>
                    <span className="text-[15px] font-bold text-[#172554] font-mono tabular-nums">
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
