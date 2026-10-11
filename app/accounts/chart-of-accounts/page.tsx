'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageContainer } from '../../../components/layout/page-container';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { Icons } from '../../../components/ui/icons';
import { useERPStorage } from '../../../lib/storage/context';
import { Account, AccountCategory, NormalBalance } from '../../../types/accounting';

export default function ChartOfAccountsPage() {
  const { accounts, saveAccount } = useERPStorage();
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
    if (!name || !code) return;

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

    await saveAccount(newAcc);
    setIsModalOpen(false);
    setCode('');
    setName('');
    setDescription('');
  };

  return (
    <PageContainer
      title="Chart of Accounts (COA)"
      subtitle="Standard double-entry accounting hierarchy for GT Road Cafe Taj"
      actions={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Icons.Plus size={14} />
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
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            {cat === 'ALL' ? 'All Accounts' : cat}
          </button>
        ))}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Account Code</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Sub-Classification</TableHead>
              <TableHead>Normal Balance</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">General Ledger</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredAccounts.map((acc) => (
              <TableRow key={acc.id}>
                <TableCell className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {acc.code}
                </TableCell>
                <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">
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
                <TableCell className="text-xs text-zinc-500">{acc.subCategory || '—'}</TableCell>
                <TableCell className="font-mono text-xs font-semibold">
                  {acc.normalBalance}
                </TableCell>
                <TableCell>
                  {acc.isSystem ? (
                    <span className="text-[10px] uppercase font-bold text-zinc-400">System Protected</span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold text-emerald-600">User Defined</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/accounts/general-ledger?accountCode=${acc.code}`}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                  >
                    View GL →
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Add Account Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add General Ledger Account"
        description="Expand your chart of accounts with custom expense, asset, or liability ledgers"
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Account Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 600700"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value as AccountCategory;
                  setCategory(newCat);
                  setNormalBalance(newCat === 'ASSET' || newCat === 'EXPENSE' ? 'DEBIT' : 'CREDIT');
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
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
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Account Name / Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Generator Fuel Expense, Linen Laundry"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Sub-Classification
              </label>
              <input
                type="text"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="e.g. Operating Expense, Direct Cost"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Normal Balance
              </label>
              <select
                value={normalBalance}
                onChange={(e) => setNormalBalance(e.target.value as NormalBalance)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <option value="DEBIT">DEBIT (Increases with Dr)</option>
                <option value="CREDIT">CREDIT (Increases with Cr)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Description / Intended Use (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Diesel fuel for backup power generators"
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
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

