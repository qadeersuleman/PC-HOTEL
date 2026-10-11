'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageContainer } from '../../components/layout/page-container';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Icons } from '../../components/ui/icons';
import { useERPStorage } from '../../lib/storage/context';
import { formatCurrency } from '../../lib/utils/formatters';
import { Vendor } from '../../types/party';

export default function VendorsPage() {
  const { vendors, vendorBalances, saveVendor } = useERPStorage();
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

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.accountNo.includes(search) ||
      v.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

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
    setIsModalOpen(false);
    setName('');
    setAccountNo('');
    setCategory('');
    setPhone('');
    setAddress('');
    setOpeningBalance('0');
  };

  return (
    <PageContainer
      title="Vendors Directory"
      subtitle="Manage food suppliers, gas providers, packaging vendors, and creditor accounts"
      actions={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Icons.Plus size={14} />
          <span>Add Vendor</span>
        </Button>
      }
    >
      {/* Search & Overview metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Creditors</span>
          <p className="text-xl font-bold mt-1">{vendors.length} Vendors</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Accounts Payable</span>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(vendorBalances.totalPayable)}
          </p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Supplier Advances</span>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {formatCurrency(vendorBalances.totalAdvances)}
          </p>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative w-full sm:w-80">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search vendor by name, account no, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Account No</TableHead>
              <TableHead>Vendor Name</TableHead>
              <TableHead>Supply Category</TableHead>
              <TableHead>Phone / Contact</TableHead>
              <TableHead>Terms</TableHead>
              <TableHead>Net Payable / Advance</TableHead>
              <TableHead className="text-right">Ledger Statement</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredVendors.map((vendor) => {
              const summary = vendorBalances.summaries.find((s) => s.vendorId === vendor.id);
              const isPayable = (summary?.netPayable ?? 0) > 0;
              const isAdvance = (summary?.advanceAmount ?? 0) > 0;

              return (
                <TableRow key={vendor.id}>
                  <TableCell className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                    {vendor.accountNo}
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{vendor.name}</p>
                    {vendor.address && <p className="text-[11px] text-zinc-400">{vendor.address}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{vendor.category}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">{vendor.phone || '—'}</TableCell>
                  <TableCell className="text-xs">{vendor.termsDays} days</TableCell>
                  <TableCell>
                    {isPayable && (
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {formatCurrency(summary!.netPayable)} <span className="text-[10px] text-zinc-400 font-normal">(Payable)</span>
                      </span>
                    )}
                    {isAdvance && (
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {formatCurrency(summary!.advanceAmount)} <span className="text-[10px] text-zinc-400 font-normal">(Advance)</span>
                      </span>
                    )}
                    {!isPayable && !isAdvance && (
                      <span className="text-zinc-400 font-medium">PKR 0.00 (Settled)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/accounts/vendor-ledger?vendorId=${vendor.id}`}
                      className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      <span>View Ledger</span>
                      <Icons.ChevronRight size={14} />
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Vendor / Supplier"
        description="Register a new creditor for food, beverage, gas, or equipment purchases"
      >
        <form onSubmit={handleCreateVendor} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Account Number
              </label>
              <input
                type="text"
                placeholder="e.g. 201970"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Category
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dairy, Poultry, Mutton, Gas"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Vendor / Business Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Al-Madina Fresh Poultry"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="0300-1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Credit Terms (Days)
              </label>
              <input
                type="number"
                value={termsDays}
                onChange={(e) => setTermsDays(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Opening Balance (PKR)
              </label>
              <input
                type="number"
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Balance Type
              </label>
              <select
                value={openingType}
                onChange={(e) => setOpeningType(e.target.value as 'CREDIT' | 'DEBIT')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <option value="CREDIT">Credit (We owe vendor / Payable)</option>
                <option value="DEBIT">Debit (Advance paid to vendor)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Address (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Wholesale Mandi, Rohri"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Vendor
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

