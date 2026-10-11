'use client';

import React, { useState } from 'react';
import { PageContainer } from '../../components/layout/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/toast';
import { Icons } from '../../components/ui/icons';
import { useERPStorage } from '../../lib/storage/context';
import { INITIAL_HOTEL_INFO } from '../../data/seed-data';

export default function SettingsPage() {
  const { resetToDemoData, items, vendors, customers, purchases, journalEntries, isUsingSupabase } = useERPStorage();
  const toast = useToast();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (confirm('Are you sure you want to clear all transactions and start completely fresh?')) {
      setIsResetting(true);
      try {
        await resetToDemoData();
        toast.success('System Reset', 'All transactions have been cleared to a clean state.');
      } catch {
        toast.error('Error', 'Failed to reset system database.');
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <PageContainer
      title="System Settings & Database Profile"
      subtitle="Hotel configuration, active cloud storage adapter, and database management controls"
      breadcrumbs={[
        { label: 'Settings & Backend' },
        { label: 'System Settings' },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Hotel Identity */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-6 border-b border-[#E2E8F0] bg-[#F8FAFC]/50">
            <CardTitle className="text-base font-bold text-[#172554]">Restaurant & Branch Profile</CardTitle>
            <p className="text-[13px] text-[#64748B]">Business entity details appearing on invoice vouchers and financial reports</p>
          </CardHeader>
          <CardContent className="space-y-5 p-6 text-[14px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block font-semibold text-[#172554] text-[13px] mb-1.5">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  disabled
                  value={INITIAL_HOTEL_INFO.name}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#172554] font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172554] text-[13px] mb-1.5">
                  Operating Currency
                </label>
                <input
                  type="text"
                  disabled
                  value="PKR (Pakistani Rupee)"
                  className="w-full h-11 px-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-mono font-bold text-[#172554] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172554] text-[13px] mb-1.5">
                  Financial Fiscal Year
                </label>
                <input
                  type="text"
                  disabled
                  value={INITIAL_HOTEL_INFO.financialYear}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#334155] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172554] text-[13px] mb-1.5">
                  Branch Contact Phone
                </label>
                <input
                  type="text"
                  disabled
                  value={INITIAL_HOTEL_INFO.phone}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#334155] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#172554] text-[13px] mb-1.5">
                Physical Location & Address
              </label>
              <input
                type="text"
                disabled
                value={INITIAL_HOTEL_INFO.address}
                className="w-full h-11 px-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#334155] focus:outline-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Database & Backend Architecture */}
        <Card>
          <CardHeader className="p-6 border-b border-[#E2E8F0] bg-[#F8FAFC]/50">
            <CardTitle className="text-base font-bold text-[#172554]">Storage & Database Engine</CardTitle>
            <p className="text-[13px] text-[#64748B]">Active backend connection status</p>
          </CardHeader>
          <CardContent className="space-y-5 p-6 text-[13px]">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Active Storage:</span>
                {isUsingSupabase ? (
                  <Badge variant="success">Supabase PostgreSQL</Badge>
                ) : (
                  <Badge variant="default">Clean LocalStorage</Badge>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Database Status:</span>
                <span className="font-mono text-[12px] font-semibold text-[#047857] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#047857] animate-pulse" />
                  <span>{isUsingSupabase ? 'Connected to Cloud DB' : 'Standalone Local Mode'}</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Accounting Engine:</span>
                <span className="text-[#0F766E] font-semibold">Strict Double-Entry (GL)</span>
              </div>
            </div>

            <div className="space-y-2 text-[#64748B] text-[12px] bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
              <div className="font-bold text-[#172554] text-[13px] mb-2">Live Database Entity Records:</div>
              <p className="flex justify-between">
                <span>Items in catalog:</span>
                <strong className="font-mono text-[#172554]">{items.length}</strong>
              </p>
              <p className="flex justify-between">
                <span>Creditors / Vendors:</span>
                <strong className="font-mono text-[#172554]">{vendors.length}</strong>
              </p>
              <p className="flex justify-between">
                <span>Customer accounts:</span>
                <strong className="font-mono text-[#172554]">{customers.length}</strong>
              </p>
              <p className="flex justify-between">
                <span>Invoices & purchases:</span>
                <strong className="font-mono text-[#172554]">{purchases.length}</strong>
              </p>
              <p className="flex justify-between">
                <span>Balanced journal entries:</span>
                <strong className="font-mono text-[#172554]">{journalEntries.length}</strong>
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="danger"
                size="md"
                className="w-full"
                isLoading={isResetting}
                onClick={handleReset}
              >
                <Icons.RefreshCw size={15} />
                <span>Reset Database (Fresh Start)</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
