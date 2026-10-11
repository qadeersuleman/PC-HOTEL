'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from '../ui/icons';
import { useERPStorage } from '../../lib/storage/context';
import { formatCurrency } from '../../lib/utils/formatters';

export function AppHeader() {
  const {
    cashAndBankTotal,
    totalStockValuation,
    vendorBalances,
    lowStockItemsCount,
    isUsingSupabase,
  } = useERPStorage();

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs border-b border-zinc-200 dark:border-zinc-800 px-6 py-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Quick financial KPIs */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs py-1">
          {/* Database indicator */}
          <Link
            href="/settings"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors ${
              isUsingSupabase
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
            }`}
            title={isUsingSupabase ? 'Connected to Supabase PostgreSQL Database' : 'Using Local Storage (Add Supabase API Key in .env.local)'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isUsingSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
            <span>{isUsingSupabase ? 'Supabase DB' : 'Local DB'}</span>
          </Link>

          {/* Cash & Bank pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium whitespace-nowrap">
            <Icons.Banknote size={14} />
            <span>Cash/Bank:</span>
            <span className="font-bold">{formatCurrency(cashAndBankTotal)}</span>
          </div>

          {/* Stock Valuation pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 font-medium whitespace-nowrap">
            <Icons.Boxes size={14} />
            <span>Stock:</span>
            <span className="font-bold">{formatCurrency(totalStockValuation)}</span>
          </div>

          {/* Accounts Payable pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-medium whitespace-nowrap">
            <Icons.CreditCard size={14} />
            <span>Payables:</span>
            <span className="font-bold">{formatCurrency(vendorBalances.totalPayable)}</span>
          </div>

          {/* Low Stock pill */}
          {lowStockItemsCount > 0 && (
            <Link
              href="/inventory/stock"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-medium whitespace-nowrap hover:bg-rose-100 transition-colors"
            >
              <Icons.AlertTriangle size={14} />
              <span>{lowStockItemsCount} Low Stock</span>
            </Link>
          )}
        </div>

        {/* Right: Quick Action Shortcuts */}
        <div className="flex items-center gap-2">
          <Link
            href="/purchases"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors"
          >
            <Icons.Plus size={13} />
            <span>Purchase</span>
          </Link>

          <Link
            href="/issues"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors"
          >
            <Icons.Plus size={13} />
            <span>Issue</span>
          </Link>

          <Link
            href="/sales"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <Icons.Plus size={13} />
            <span>Daily Sales</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

