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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-6 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Financial KPI Quick Chips */}
        <div className="flex items-center gap-2.5 overflow-x-auto text-[13px] py-1">
          {/* Database indicator */}
          <Link
            href="/settings"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-full border transition-all ${
              isUsingSupabase
                ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0] hover:bg-[#D1FAE5]'
                : 'bg-slate-100 text-[#475569] border-[#E2E8F0] hover:bg-slate-200'
            }`}
            title={isUsingSupabase ? 'Connected to Supabase PostgreSQL Database' : 'Using Local Storage'}
          >
            <span className={`w-2 h-2 rounded-full ${isUsingSupabase ? 'bg-[#047857] animate-pulse' : 'bg-slate-400'}`} />
            <span>{isUsingSupabase ? 'Supabase Cloud' : 'Local Storage'}</span>
          </Link>

          {/* Cash & Bank chip */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] font-medium whitespace-nowrap shadow-2xs">
            <Icons.Banknote size={15} />
            <span className="text-[#065F46]">Cash/Bank:</span>
            <span className="font-bold tabular-nums font-mono text-[14px]">{formatCurrency(cashAndBankTotal)}</span>
          </div>

          {/* Stock Valuation chip */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] font-medium whitespace-nowrap shadow-2xs">
            <Icons.Boxes size={15} />
            <span className="text-[#1E40AF]">Stock:</span>
            <span className="font-bold tabular-nums font-mono text-[14px]">{formatCurrency(totalStockValuation)}</span>
          </div>

          {/* Accounts Payable chip */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] text-[#C2410C] font-medium whitespace-nowrap shadow-2xs">
            <Icons.CreditCard size={15} />
            <span className="text-[#9A3412]">Payables:</span>
            <span className="font-bold tabular-nums font-mono text-[14px]">{formatCurrency(vendorBalances.totalPayable)}</span>
          </div>

          {/* Low Stock chip */}
          {lowStockItemsCount > 0 && (
            <Link
              href="/inventory/stock"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] font-semibold whitespace-nowrap hover:bg-[#FEE2E2] transition-colors shadow-2xs"
            >
              <Icons.AlertTriangle size={15} />
              <span>{lowStockItemsCount} Low Stock</span>
            </Link>
          )}
        </div>

        {/* Right: Quick Action Shortcuts */}
        <div className="flex items-center gap-2">
          <Link
            href="/purchases/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#334155] shadow-2xs transition-all hover:border-[#94A3B8]"
          >
            <Icons.Plus size={14} className="text-[#0F766E]" />
            <span>Purchase</span>
          </Link>

          <Link
            href="/issues/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#334155] shadow-2xs transition-all hover:border-[#94A3B8]"
          >
            <Icons.Plus size={14} className="text-[#0F766E]" />
            <span>Store Issue</span>
          </Link>

          <Link
            href="/sales"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white shadow-xs transition-all active:scale-[0.99]"
          >
            <Icons.Plus size={14} />
            <span>Daily Sales</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
