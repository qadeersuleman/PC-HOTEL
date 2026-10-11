'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '../ui/icons';
import { useERPStorage } from '../../lib/storage/context';

interface NavItem {
  title: string;
  href: string;
  icon: keyof typeof Icons;
  badge?: string | number;
  badgeColor?: string;
}

interface NavSection {
  sectionTitle: string;
  items: NavItem[];
}

export function AppSidebar() {
  const pathname = usePathname();
  const { lowStockItemsCount, isUsingSupabase } = useERPStorage();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigationSections: NavSection[] = [
    {
      sectionTitle: 'MAIN OVERVIEW',
      items: [
        { title: 'Dashboard', href: '/dashboard', icon: 'Dashboard' },
      ],
    },
    {
      sectionTitle: 'INVENTORY & STORE',
      items: [
        { title: 'Purchase Invoices', href: '/purchases', icon: 'ShoppingCart' },
        { title: 'Issue Invoices', href: '/issues', icon: 'ArrowUpRight' },
        {
          title: 'Current Stock',
          href: '/inventory/stock',
          icon: 'Boxes',
          badge: lowStockItemsCount > 0 ? `${lowStockItemsCount} Low` : undefined,
          badgeColor: 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]',
        },
        { title: 'Stock Adjustments & Spoilage', href: '/inventory/adjustments', icon: 'AlertTriangle' },
        { title: 'Items & Categories', href: '/inventory/items', icon: 'Layers' },
        { title: 'Departments', href: '/departments', icon: 'Building' },
      ],
    },
    {
      sectionTitle: 'PARTIES & LEDGERS',
      items: [
        { title: 'Vendors / Suppliers', href: '/vendors', icon: 'Users' },
        { title: 'Customers & Guests', href: '/customers', icon: 'UserCheck' },
        { title: 'Vendor Ledger', href: '/accounts/vendor-ledger', icon: 'BookOpen' },
        { title: 'Customer Ledger', href: '/accounts/customer-ledger', icon: 'BookOpen' },
        { title: 'Accounts Payable (AP)', href: '/accounts/payable', icon: 'CreditCard' },
        { title: 'Accounts Receivable (AR)', href: '/accounts/receivable', icon: 'Receipt' },
      ],
    },
    {
      sectionTitle: 'VOUCHERS & ACCOUNTING',
      items: [
        { title: 'CRV — Cash Receipt', href: '/vouchers/crv', icon: 'ArrowDownLeft' },
        { title: 'CPV — Cash Payment', href: '/vouchers/cpv', icon: 'ArrowUpRight' },
        { title: 'JV — Journal Voucher', href: '/vouchers/jv', icon: 'FileText' },
        { title: 'Cash & Bank Accounts', href: '/accounts/cash-bank', icon: 'Banknote' },
        { title: 'Chart of Accounts', href: '/accounts/chart-of-accounts', icon: 'Landmark' },
        { title: 'General Ledger (GL)', href: '/accounts/general-ledger', icon: 'FileText' },
      ],
    },
    {
      sectionTitle: 'SALES & FINANCIAL REPORTS',
      items: [
        { title: 'Daily Sales Entry', href: '/sales', icon: 'DollarSign' },
        { title: 'Income Statement (P&L)', href: '/reports/income-statement', icon: 'TrendingUp' },
        { title: 'Trial Balance', href: '/reports/trial-balance', icon: 'Scale' },
        { title: 'Balance Sheet', href: '/reports/balance-sheet', icon: 'PieChart' },
        { title: 'Payables & Receivables Aging', href: '/reports/aging', icon: 'Clock' },
        { title: 'Stock & Sales Reports', href: '/reports/inventory-sales', icon: 'BarChart3' },
      ],
    },
    {
      sectionTitle: 'SETTINGS & BACKEND',
      items: [
        { title: 'System Settings', href: '/settings', icon: 'Settings' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="lg:hidden fixed top-3 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#172554] shadow-md focus:outline-none hover:bg-[#F8FAFC] transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileOpen ? <Icons.X size={20} /> : <Icons.Menu size={20} />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white text-[#334155] flex flex-col border-r border-[#E2E8F0] shadow-[1px_0_4px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#E2E8F0] bg-white flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E] flex items-center justify-center text-white shadow-sm font-bold text-lg tracking-wider group-hover:bg-[#115E59] transition-colors">
              T
            </div>
            <div>
              <h1 className="font-bold text-[#172554] text-[15px] tracking-tight leading-tight">
                GT ROAD CAFE TAJ
              </h1>
              <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider mt-0.5">
                Restaurant ERP
              </p>
            </div>
          </Link>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navigationSections.map((sec, idx) => (
            <div key={idx}>
              <h2 className="px-3 text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                {sec.sectionTitle}
              </h2>
              <ul className="space-y-1">
                {sec.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
                  const IconComp = Icons[item.icon] || Icons.FileText;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] transition-all ${
                          isActive
                            ? 'bg-[#0F766E]/10 text-[#0F766E] font-semibold border-l-4 border-[#0F766E] pl-2.5 shadow-2xs'
                            : 'text-[#64748B] hover:text-[#0F766E] hover:bg-[#F8FAFC] font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <IconComp size={18} className={isActive ? 'text-[#0F766E]' : 'text-[#64748B] group-hover:text-[#0F766E]'} />
                          <span className="truncate">{item.title}</span>
                        </div>
                        {item.badge && (
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer info with database badge */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] text-[12px] flex items-center justify-between">
          <span className="text-[#64748B] font-medium">FY 2026-2027</span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            isUsingSupabase
              ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
              : 'bg-slate-100 text-[#475569] border-[#E2E8F0]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isUsingSupabase ? 'bg-[#047857] animate-pulse' : 'bg-slate-400'}`} />
            {isUsingSupabase ? 'Cloud DB' : 'Local DB'}
          </span>
        </div>
      </aside>
    </>
  );
}
