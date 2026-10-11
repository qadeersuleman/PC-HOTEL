'use client';

import React, { useState } from 'react';
import { PageContainer } from '../../components/layout/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Icons } from '../../components/ui/icons';
import { useERPStorage } from '../../lib/storage/context';
import { INITIAL_HOTEL_INFO } from '../../data/seed-data';

export default function SettingsPage() {
  const { resetToDemoData, items, vendors, customers, purchases, journalEntries, isUsingSupabase } = useERPStorage();
  const [isResetting, setIsResetting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleReset = async () => {
    if (confirm('Are you sure you want to clear all transactions and start completely fresh?')) {
      setIsResetting(true);
      await resetToDemoData();
      setIsResetting(false);
      setNotification('System successfully cleared all transactions to a fresh state!');
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <PageContainer
      title="System Settings & Database Profile"
      subtitle="Hotel configuration, active storage adapter, and demo database controls"
    >
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <Icons.CheckCircle size={16} />
          <span>{notification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Hotel Identity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hotel & Branch Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  disabled
                  value={INITIAL_HOTEL_INFO.name}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Operating Currency
                </label>
                <input
                  type="text"
                  disabled
                  value="PKR (Pakistani Rupee)"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Financial Year
                </label>
                <input
                  type="text"
                  disabled
                  value={INITIAL_HOTEL_INFO.financialYear}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Branch Contact
                </label>
                <input
                  type="text"
                  disabled
                  value={INITIAL_HOTEL_INFO.phone}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Branch Location & Address
              </label>
              <input
                type="text"
                disabled
                value={INITIAL_HOTEL_INFO.address}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Database & Backend Architecture */}
        <Card>
          <CardHeader>
            <CardTitle>Storage & Backend Database</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Active Storage:</span>
                {isUsingSupabase ? (
                  <Badge variant="success">Supabase PostgreSQL</Badge>
                ) : (
                  <Badge variant="default">Clean LocalStorage</Badge>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Database Status:</span>
                <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {isUsingSupabase ? '● Connected to Cloud DB' : '○ Standalone Offline Mode'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Accounting Engine:</span>
                <span className="text-emerald-600 font-semibold">Strict Double-Entry (GL)</span>
              </div>
            </div>

            <div className="space-y-1.5 text-zinc-500 text-[11px] bg-zinc-50 dark:bg-zinc-800/20 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
              <div className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Live Database Records:</div>
              <p>• Items in catalog: <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{items.length}</span></p>
              <p>• Creditors / Vendors: <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{vendors.length}</span></p>
              <p>• Customers & Accounts: <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{customers.length}</span></p>
              <p>• Invoices & Purchases: <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{purchases.length}</span></p>
              <p>• Balanced Journal Entries: <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{journalEntries.length}</span></p>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="danger"
                size="sm"
                className="w-full"
                isLoading={isResetting}
                onClick={handleReset}
              >
                <Icons.RefreshCw size={14} />
                <span>Clear All Transactions (Fresh Start)</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

