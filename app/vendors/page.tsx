'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageContainer } from '../../components/layout/page-container';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { EmptyState } from '../../components/ui/empty-state';
import { Icons } from '../../components/ui/icons';
import { useERPStorage } from '../../lib/storage/context';
import { useToast } from '../../components/ui/toast';
import { formatCurrency } from '../../lib/utils/formatters';
import { Vendor } from '../../types/party';

export default function VendorsPage() {
  const { vendors, vendorBalances, saveVendor } = useERPStorage();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New vendor form
  const [name, setName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [openingType, setOpeningType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [termsDays, setTermsDays] = useState('15');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.accountNo.includes(search) ||
      v.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Validation Error', 'Please enter vendor business name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newVendor: Vendor = {
        id: `ven-${Date.now()}`,
        accountNo: accountNo || `2019${vendors.length + 10}`,
        name,
        category: category || 'General Supplier',
        phone,
        address,
        openingBalance: parseFloat(openingBalance) || 0,
        openingBalanceType: openingType,
        termsDays: parseInt(termsDays) || 15,
        isActive: true,
      };

      await saveVendor(newVendor);
      toast.success('Vendor Registered', `${newVendor.name} added to suppliers list.`);
      setIsModalOpen(false);
      setName('');
      setAccountNo('');
      setCategory('');
      setPhone('');
      setAddress('');
      setOpeningBalance('0');
    } catch (err) {
      toast.error('Save Failed', 'Could not register vendor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Vendors & Suppliers Directory"
      subtitle="Manage food suppliers, poultry butchers, dairy distributors, and creditor accounts"
      actions={
        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
          <Icons.Plus size={16} />
          <span>Register New Vendor</span>
        </Button>
      }
    >
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#64748B] uppercase tracking-wider font-bold">Registered Vendors</span>
            <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] border border-[#E0F2FE] flex items-center justify-center text-[#0284C7] shadow-2xs">
              <Icons.Users size={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#172554] mt-2 font-mono tabular-nums">{vendors.length} Suppliers</p>
          <p className="text-[12px] text-[#64748B] mt-1">Active creditor profiles</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#64748B] uppercase tracking-wider font-bold">Total Accounts Payable (AP)</span>
            <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] flex items-center justify-center text-[#C2410C] shadow-2xs">
              <Icons.CreditCard size={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#C2410C] mt-2 font-mono tabular-nums">
            {formatCurrency(vendorBalances.totalPayable)}
          </p>
          <p className="text-[12px] text-[#64748B] mt-1">Pending credit purchases</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#64748B] uppercase tracking-wider font-bold">Vendor Advances</span>
            <div className="w-10 h-10 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] flex items-center justify-center text-[#7E22CE] shadow-2xs">
              <Icons.Banknote size={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#7E22CE] mt-2 font-mono tabular-nums">
            {formatCurrency(vendorBalances.totalAdvances)}
          </p>
          <p className="text-[12px] text-[#64748B] mt-1">Prepaid balance assets</p>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="relative w-full sm:w-96">
            <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
            <input
              type="text"
              placeholder="Search vendors by account #, name, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table or EmptyState */}
      {filteredVendors.length === 0 ? (
        <EmptyState
          icon="Users"
          title="No vendors registered"
          description="Add meat, dairy, produce, spices, gas, and disposable packaging suppliers."
          action={
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              <Icons.Plus size={16} />
              <span>Register Vendor</span>
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Account #</TableHead>
              <TableHead>Vendor / Company Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Phone / Contact</TableHead>
              <TableHead className="text-right">Terms</TableHead>
              <TableHead className="text-right">Current Payable Balance</TableHead>
              <TableHead className="text-right">Advance Balance</TableHead>
              <TableHead className="text-right">Ledger Statement</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredVendors.map((vendor) => {
              const summary = vendorBalances.summaries.find((s) => s.vendorId === vendor.id);
              const payable = summary?.netPayable || 0;
              const advance = summary?.advanceAmount || 0;

              return (
                <TableRow key={vendor.id}>
                  <TableCell className="font-mono font-bold text-[#172554]">{vendor.accountNo}</TableCell>
                  <TableCell className="font-semibold text-[#172554]">
                    {vendor.name}
                    {vendor.address && <p className="text-[12px] text-[#64748B] font-normal truncate max-w-xs">{vendor.address}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary" size="sm">{vendor.category}</Badge>
                  </TableCell>
                  <TableCell className="text-[#64748B] font-mono">{vendor.phone || '—'}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-[#64748B]">{vendor.termsDays} Days</TableCell>
                  <TableCell className="text-right font-bold font-mono tabular-nums">
                    <span className={payable > 0 ? 'text-[#C2410C]' : 'text-[#64748B]'}>
                      {formatCurrency(payable)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold font-mono tabular-nums">
                    <span className={advance > 0 ? 'text-[#7E22CE]' : 'text-[#64748B]'}>
                      {formatCurrency(advance)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/accounts/vendor-ledger?vendorId=${vendor.id}`}>
                      <Button variant="outline" size="sm">
                        <Icons.BookOpen size={14} />
                        <span>View Ledger</span>
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Register Vendor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Vendor"
        description="Creates supplier profile, Accounts Payable sub-ledger, and credit terms"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateVendor} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                Vendor / Business Name <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Al-Madina Fresh Meat Shop"
                className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                GL Account Number
              </label>
              <input
                type="text"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                placeholder="e.g. 201910"
                className="w-full h-12 px-4 text-[15px] font-mono rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                Supply Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Meat & Poultry, Dairy, Produce"
                className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0300-1234567"
                className="w-full h-12 px-4 text-[15px] font-mono rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                Opening Balance (PKR)
              </label>
              <input
                type="number"
                step="any"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full h-12 px-4 text-[15px] font-mono tabular-nums rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                Opening Balance Type
              </label>
              <select
                value={openingType}
                onChange={(e) => setOpeningType(e.target.value as 'CREDIT' | 'DEBIT')}
                className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none cursor-pointer"
              >
                <option value="CREDIT">Credit (We Owe Supplier - Accounts Payable)</option>
                <option value="DEBIT">Debit (Supplier Owes Us - Advance Paid)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                Credit Payment Terms (Days)
              </label>
              <input
                type="number"
                value={termsDays}
                onChange={(e) => setTermsDays(e.target.value)}
                className="w-full h-12 px-4 text-[15px] font-mono tabular-nums rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                Business Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Market address or shop location"
                className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1F5F9]">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              <Icons.CheckCircle size={16} />
              <span>Save Vendor</span>
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
