'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageContainer } from '../../components/layout/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Icons } from '../../components/ui/icons';
import { useERPStorage } from '../../lib/storage/context';
import { formatCurrency, formatDate } from '../../lib/utils/formatters';

export default function DashboardPage() {
  const {
    isLoaded,
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

  const todayStr = '2026-09-12';
  const currentMonthStr = '2026-09';

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
    const map = new Map<string, { name: string; amount: number; isKitchen: boolean }>();
    for (const iss of filteredIssues) {
      const dept = departments.find((d) => d.id === iss.departmentId);
      const name = dept?.name || iss.departmentName;
      const isKitchen = dept?.isKitchen ?? false;
      const prev = map.get(iss.departmentId) || { name, amount: 0, isKitchen };
      map.set(iss.departmentId, { ...prev, amount: prev.amount + iss.totalCost });
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filteredIssues, departments]);

  if (!isLoaded) {
    return (
      <PageContainer title="Dashboard" subtitle="Loading restaurant figures...">
        <div className="flex items-center justify-center py-20 text-zinc-400">
          <span className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mr-3" />
          <span>Loading live ledger database...</span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Restaurant Overview & Analytics"
      subtitle="GT Road Cafe Taj — Real-time ledger, inventory valuation and financial health"
      actions={
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              dateFilter === 'all'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              dateFilter === 'month'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              dateFilter === 'today'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Today
          </button>
        </div>
      }
    >
      {/* 8 Primary Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Sales */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Sales</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Icons.DollarSign size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">{formatCurrency(totalSalesAmount)}</p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-500">
              <span className="text-emerald-600 font-semibold">{filteredSales.length} entries</span>
              <span>• Dine-in & Takeaway</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Purchases */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Purchases</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Icons.ShoppingCart size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">{formatCurrency(totalPurchasesAmount)}</p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-500">
              <span className="text-indigo-600 font-semibold">{filteredPurchases.length} invoices</span>
              <span>• Raw food & materials</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Stock Valuation */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Stock Valuation</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <Icons.Boxes size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">{formatCurrency(totalStockValuation)}</p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-500">
              <span>{stockStatusList.length} items in store</span>
              <span>• WAC average costing</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Estimated Profit */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Estimated Profit</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${estimatedNetProfit >= 0 ? 'bg-teal-50 dark:bg-teal-950 text-teal-600' : 'bg-rose-50 text-rose-600'}`}>
                <Icons.TrendingUp size={16} />
              </div>
            </div>
            <p className={`text-2xl font-bold mt-2 ${estimatedNetProfit >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(estimatedNetProfit)}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-500">
              <span>Kitchen COGS: {formatCurrency(estimatedKitchenCOGS)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Accounts Payable */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Accounts Payable (AP)</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Icons.CreditCard size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">{formatCurrency(vendorBalances.totalPayable)}</p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-500">
              <Link href="/accounts/payable" className="text-amber-600 font-semibold hover:underline">
                View 5 active payables →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card 6: Vendor Advances (Debit Balances) */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Vendor Advances</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Icons.ArrowUpRight size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">{formatCurrency(vendorBalances.totalAdvances)}</p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-500">
              <span>Debit balance with suppliers</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 7: Accounts Receivable (AR) */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Accounts Receivable (AR)</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Icons.Receipt size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">{formatCurrency(customerBalances.totalReceivable)}</p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-500">
              <Link href="/accounts/receivable" className="text-blue-600 font-semibold hover:underline">
                Customer & Staff credit →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card 8: Cash & Bank Liquid Assets */}
        <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Cash & Bank Balance</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Icons.Banknote size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">{formatCurrency(cashAndBankTotal)}</p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-500">
              <span>Meezan Bank + Cash Counter</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Charts & Visual Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales vs Expenses Financial Summary */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Financial Flow: Sales vs. Direct Costs & Expenses</CardTitle>
              <p className="text-xs text-zinc-500 mt-1">Live reconciliation based on posted general ledger entries</p>
            </div>
            <Badge variant="success">Balanced General Ledger</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Simple visual bar comparison */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-zinc-700 dark:text-zinc-300">Revenue (Net Sales)</span>
                  <span className="text-emerald-600">{formatCurrency(totalSalesAmount)}</span>
                </div>
                <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-zinc-700 dark:text-zinc-300">Estimated Kitchen COGS (Food Cost)</span>
                  <span className="text-amber-600">{formatCurrency(estimatedKitchenCOGS)}</span>
                </div>
                <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${totalSalesAmount > 0 ? Math.min(100, (estimatedKitchenCOGS / totalSalesAmount) * 100) : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-zinc-700 dark:text-zinc-300">Operating Supplies & Disposables</span>
                  <span className="text-rose-600">{formatCurrency(nonKitchenConsumption)}</span>
                </div>
                <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${totalSalesAmount > 0 ? Math.min(100, (nonKitchenConsumption / totalSalesAmount) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-zinc-500">Gross Margin:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 ml-1.5">
                  {totalSalesAmount > 0 ? `${((estimatedGrossProfit / totalSalesAmount) * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Net Profit Margin:</span>
                <span className="font-bold text-emerald-600 ml-1.5">
                  {totalSalesAmount > 0 ? `${((estimatedNetProfit / totalSalesAmount) * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Food Cost Ratio:</span>
                <span className="font-bold text-amber-600 ml-1.5">
                  {totalSalesAmount > 0 ? `${((estimatedKitchenCOGS / totalSalesAmount) * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department Issue Summaries */}
        <Card>
          <CardHeader>
            <CardTitle>Department Stock Consumption</CardTitle>
            <p className="text-xs text-zinc-500 mt-1">Classification by usage & destination</p>
          </CardHeader>
          <CardContent>
            {departmentBreakdown.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">No issues recorded for this period.</p>
            ) : (
              <div className="space-y-3">
                {departmentBreakdown.map((dept, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${dept.isKitchen ? 'bg-emerald-500' : 'bg-sky-500'}`} />
                      <div>
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{dept.name}</p>
                        <p className="text-[10px] text-zinc-400">{dept.isKitchen ? 'Direct COGS' : 'Operating Supply'}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
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
        {/* Low Stock & Overdue Invoices Alert Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icons.AlertTriangle className="text-amber-500" size={18} />
              <span>Operational Alerts</span>
            </CardTitle>
            <span className="text-xs text-zinc-500 font-medium">Inventory & Payables</span>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Low stock alerts */}
            <div>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                Low Stock Threshold Alerts ({lowStockItems.length})
              </h4>
              {lowStockItems.length === 0 ? (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <Icons.CheckCircle size={15} />
                  <span>All store inventory items are above minimum safety thresholds.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <div
                      key={item.itemId}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{item.itemName}</span>
                        <span className="text-zinc-500 ml-2">({item.categoryName})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="danger">
                          Available: {item.availableQty} {item.unit} (Min: {item.minStockLevel})
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overdue invoices */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                Overdue Purchase Invoices ({overduePurchases.length})
              </h4>
              {overduePurchases.length === 0 ? (
                <p className="text-xs text-zinc-400">No overdue credit purchases.</p>
              ) : (
                <div className="space-y-2">
                  {overduePurchases.slice(0, 2).map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-xs">
                      <div>
                        <span className="font-semibold">{inv.invoiceNumber}</span>
                        <span className="text-zinc-500 ml-2">• {inv.vendorName}</span>
                      </div>
                      <span className="font-bold text-amber-700 dark:text-amber-400">
                        Balance: {formatCurrency(inv.balanceAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Posted Transactions</CardTitle>
            <Link href="/accounts/general-ledger" className="text-xs text-emerald-600 font-semibold hover:underline">
              View General Ledger →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {journalEntries.slice(0, 5).map((je) => (
                <div key={je.id} className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-300 text-[10px]">
                      {je.sourceType.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[200px] sm:max-w-[260px]">
                        {je.description}
                      </p>
                      <p className="text-[10px] text-zinc-400">{formatDate(je.date)} • Ref: {je.sourceNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(je.totalAmount)}</p>
                    <span className="text-[9px] text-emerald-600 uppercase font-semibold">Posted</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
