'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageContainer } from '../../../components/layout/page-container';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { EmptyState } from '../../../components/ui/empty-state';
import { useToast } from '../../../components/ui/toast';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { Account, AccountCategory, NormalBalance } from '../../../types/accounting';

export default function ChartOfAccountsPage() {
  const { accounts, saveAccount } = useERPStorage();
  const toast = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New account form
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AccountCategory>('EXPENSE');
  const [subCategory, setSubCategory] = useState('Operating Expense');
  const [normalBalance, setNormalBalance] = useState<NormalBalance>('DEBIT');
  const [description, setDescription] = useState('');

  const filteredAccounts = accounts.filter(
    (a) => selectedCategory === 'ALL' || a.category === selectedCategory
  );

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      toast.error('Validation Error', 'Account code and title are required.');
      return;
    }

    const newAcc: Account = {
      id: `acc-${code}`,
      code,
      name,
      category,
      subCategory,
      normalBalance,
      description,
      isSystem: false,
      isActive: true,
    };

    try {
      await saveAccount(newAcc);
      toast.success('Account Created', `GL Account ${code} — ${name} added.`);
      setIsModalOpen(false);
      setCode('');
      setName('');
      setDescription('');
    } catch {
      toast.error('Error', 'Failed to save account.');
    }
  };

  return (
    <PageContainer
      title="Chart of Accounts (COA)"
      subtitle="Standard double-entry accounting hierarchy and ledger classification for GT Road Cafe Taj"
      breadcrumbs={[
        { label: 'Financial Accounts' },
        { label: 'Chart of Accounts' },
      ]}
      actions={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Icons.Plus size={15} />
          <span>Add New Account</span>
        </Button>
      }
    >
      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 text-[13px] font-semibold rounded-xl transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-[#0F766E] text-white shadow-2xs'
                : 'bg-white text-[#64748B] hover:text-[#172554] border border-[#E2E8F0] hover:bg-[#F8FAFC]'
            }`}
          >
            {cat === 'ALL' ? 'All Accounts' : cat}
          </button>
        ))}
      </div>

      <Card>
        {filteredAccounts.length === 0 ? (
          <EmptyState
            icon="Landmark"
            title="No Accounts Found"
            description="No ledger accounts found for this classification."
            actionLabel="Create Account"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Account Code</TableHead>
                <TableHead>Account Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Sub-Classification</TableHead>
                <TableHead className="text-center">Normal Balance</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-right">General Ledger</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell className="font-mono font-bold text-[#172554] text-[13px]">
                    {acc.code}
                  </TableCell>
                  <TableCell className="font-semibold text-[#172554] text-[14px]">
                    {acc.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        acc.category === 'ASSET'
                          ? 'info'
                          : acc.category === 'LIABILITY'
                          ? 'warning'
                          : acc.category === 'EQUITY'
                          ? 'purple'
                          : acc.category === 'REVENUE'
                          ? 'success'
                          : 'default'
                      }
                    >
                      {acc.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[13px] text-[#64748B]">{acc.subCategory || '—'}</TableCell>
                  <TableCell className="font-mono text-[13px] font-bold text-center">
                    <span className={acc.normalBalance === 'DEBIT' ? 'text-[#047857]' : 'text-[#C2410C]'}>
                      {acc.normalBalance}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {acc.isSystem ? (
                      <span className="text-[11px] uppercase font-bold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded">System Core</span>
                    ) : (
                      <span className="text-[11px] uppercase font-bold text-[#0F766E] bg-[#0F766E]/10 px-2 py-0.5 rounded">User Defined</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/accounts/general-ledger?accountCode=${acc.code}`}>
                      <Button variant="outline" size="sm">
                        <Icons.BookOpen size={13} />
                        <span>View GL</span>
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Add Account Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add General Ledger Account"
        description="Expand your chart of accounts with custom expense, asset, or liability ledgers."
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                Account Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 600700"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#172554] font-mono focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value as AccountCategory;
                  setCategory(newCat);
                  setNormalBalance(newCat === 'ASSET' || newCat === 'EXPENSE' ? 'DEBIT' : 'CREDIT');
                }}
                className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              >
                <option value="ASSET">ASSET</option>
                <option value="LIABILITY">LIABILITY</option>
                <option value="EQUITY">EQUITY</option>
                <option value="REVENUE">REVENUE</option>
                <option value="EXPENSE">EXPENSE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
              Account Name / Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Generator Fuel Expense, Linen Laundry"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                Sub-Classification
              </label>
              <input
                type="text"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="e.g. Operating Expense, Direct Cost"
                className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
                Normal Balance
              </label>
              <select
                value={normalBalance}
                onChange={(e) => setNormalBalance(e.target.value as NormalBalance)}
                className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              >
                <option value="DEBIT">DEBIT (Increases with Dr)</option>
                <option value="CREDIT">CREDIT (Increases with Cr)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#172554] mb-1.5">
              Description / Intended Use (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Diesel fuel for backup power generators"
              className="w-full h-11 px-3 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Account
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
