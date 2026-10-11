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
  const { lowStockItemsCount } = useERPStorage();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigationSections: NavSection[] = [
    {
      sectionTitle: 'OVERVIEW',
      items: [
        { title: 'Dashboard', href: '/dashboard', icon: 'Dashboard' },
      ],
    },
    {
      sectionTitle: 'INVENTORY',
      items: [
        { title: 'Purchase Invoices', href: '/purchases', icon: 'ShoppingCart' },
        { title: 'Issue Invoices', href: '/issues', icon: 'ArrowUpRight' },
        {
          title: 'Current Stock',
          href: '/inventory/stock',
          icon: 'Boxes',
          badge: lowStockItemsCount > 0 ? `${lowStockItemsCount} Low` : undefined,
          badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
        },
        { title: 'Stock Adjustments & Wastage', href: '/inventory/adjustments', icon: 'AlertTriangle' },
        { title: 'Items & Categories', href: '/inventory/items', icon: 'Layers' },
        { title: 'Departments', href: '/departments', icon: 'Building' },
      ],
    },
    {
      sectionTitle: 'PARTIES & LEDGERS',
      items: [
        { title: 'Vendors', href: '/vendors', icon: 'Users' },
        { title: 'Customers', href: '/customers', icon: 'UserCheck' },
        { title: 'Vendor Ledger', href: '/accounts/vendor-ledger', icon: 'BookOpen' },
        { title: 'Customer Ledger', href: '/accounts/customer-ledger', icon: 'BookOpen' },
        { title: 'Accounts Payable', href: '/accounts/payable', icon: 'CreditCard' },
        { title: 'Accounts Receivable', href: '/accounts/receivable', icon: 'Receipt' },
      ],
    },
    {
      sectionTitle: 'ACCOUNTING & VOUCHERS',
      items: [
        { title: 'CRV — Receipt Voucher', href: '/vouchers/crv', icon: 'ArrowDownLeft' },
        { title: 'CPV — Payment Voucher', href: '/vouchers/cpv', icon: 'ArrowUpRight' },
        { title: 'JV — Journal Voucher', href: '/vouchers/jv', icon: 'FileText' },
        { title: 'Cash & Bank', href: '/accounts/cash-bank', icon: 'Banknote' },
        { title: 'Chart of Accounts', href: '/accounts/chart-of-accounts', icon: 'Landmark' },
        { title: 'General Ledger', href: '/accounts/general-ledger', icon: 'FileText' },
      ],
    },
    {
      sectionTitle: 'SALES & REPORTS',
      items: [
        { title: 'Sales Entry', href: '/sales', icon: 'DollarSign' },
        { title: 'Income Statement (P&L)', href: '/reports/income-statement', icon: 'TrendingUp' },
        { title: 'Trial Balance', href: '/reports/trial-balance', icon: 'Scale' },
        { title: 'Balance Sheet', href: '/reports/balance-sheet', icon: 'PieChart' },
        { title: 'Payables & Receivables Aging', href: '/reports/aging', icon: 'Clock' },
        { title: 'Stock & Sales Reports', href: '/reports/inventory-sales', icon: 'BarChart3' },
      ],
    },
    {
      sectionTitle: 'CONFIGURATION',
      items: [
        { title: 'Settings', href: '/settings', icon: 'Settings' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg bg-zinc-900 text-white shadow-md focus:outline-none"
        >
          {isMobileOpen ? <Icons.X size={20} /> : <Icons.Menu size={20} />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-xs"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-zinc-900 text-zinc-300 flex flex-col border-r border-zinc-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-sm font-bold text-lg">
              T
            </div>
            <div>
              <h1 className="font-bold text-white text-sm tracking-wide">GT ROAD CAFE TAJ</h1>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Restaurant ERP</p>
            </div>
          </Link>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-700">
          {navigationSections.map((sec, idx) => (
            <div key={idx}>
              <h2 className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                {sec.sectionTitle}
              </h2>
              <ul className="space-y-0.5">
                {sec.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  const IconComp = Icons[item.icon] || Icons.FileText;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <IconComp size={16} className={isActive ? 'text-white' : 'text-zinc-400'} />
                          <span className="truncate">{item.title}</span>
                        </div>
                        {item.badge && (
                          <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${item.badgeColor || 'bg-zinc-800 text-zinc-300'}`}>
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

        {/* Footer info */}
        <div className="p-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
          <span>FY 2026-2027</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Storage Active
          </span>
        </div>
      </aside>
    </>
  );
}

