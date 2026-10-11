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
import { Customer } from '../../types/party';

export default function CustomersPage() {
  const { customers, customerBalances, saveCustomer } = useERPStorage();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New customer form
  const [name, setName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [category, setCategory] = useState<'RESTAURANT_GUEST' | 'CORPORATE' | 'EMPLOYEE' | 'MISC'>('RESTAURANT_GUEST');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [creditLimit, setCreditLimit] = useState('50000');

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.accountNo.includes(search) ||
      (c.phone && c.phone.includes(search))
  );

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      accountNo: accountNo || `1005${customers.length + 14}`,
      name,
      category,
      phone,
      address,
      openingBalance: parseFloat(openingBalance) || 0,
      openingBalanceType: 'DEBIT', // Standard receivable
      creditLimit: parseFloat(creditLimit) || 50000,
      isActive: true,
    };

    await saveCustomer(newCustomer);
    setIsModalOpen(false);
    setName('');
    setAccountNo('');
    setPhone('');
    setAddress('');
    setOpeningBalance('0');
  };

  return (
    <PageContainer
      title="Customers & Credit Accounts"
      subtitle="Manage corporate accounts, hotel guest credit ledgers, and staff food advances"
      actions={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Icons.Plus size={14} />
          <span>Add Customer</span>
        </Button>
      }
    >
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Credit Customers</span>
          <p className="text-xl font-bold mt-1">{customers.length} Accounts</p>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Accounts Receivable</span>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {formatCurrency(customerBalances.totalReceivable)}
          </p>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative w-full sm:w-80">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search by customer name, phone, or account no..."
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
              <TableHead>Customer / Entity Name</TableHead>
              <TableHead>Account Type</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Credit Limit</TableHead>
              <TableHead>Outstanding Balance</TableHead>
              <TableHead className="text-right">Ledger Statement</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((cust) => {
              const summary = customerBalances.summaries.find((s) => s.customerId === cust.id);
              const isReceivable = (summary?.netReceivable ?? 0) > 0;

              return (
                <TableRow key={cust.id}>
                  <TableCell className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                    {cust.accountNo}
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{cust.name}</p>
                    {cust.address && <p className="text-[11px] text-zinc-400">{cust.address}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={cust.category === 'CORPORATE' ? 'purple' : cust.category === 'EMPLOYEE' ? 'warning' : 'default'}>
                      {cust.category.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">{cust.phone || '—'}</TableCell>
                  <TableCell className="text-xs">{cust.creditLimit ? formatCurrency(cust.creditLimit) : 'No limit'}</TableCell>
                  <TableCell>
                    {isReceivable ? (
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(summary!.netReceivable)}
                      </span>
                    ) : (
                      <span className="text-zinc-400 font-medium">PKR 0.00 (Cleared)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/accounts/customer-ledger?customerId=${cust.id}`}
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

      {/* Add Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Customer / Credit Account"
        description="Register a corporate banquet client, frequent guest, or employee ledger"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Account Number
              </label>
              <input
                type="text"
                placeholder="e.g. 100515"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Account Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <option value="RESTAURANT_GUEST">Restaurant Guest</option>
                <option value="CORPORATE">Corporate / Banquet Client</option>
                <option value="EMPLOYEE">Staff / Employee Advance</option>
                <option value="MISC">Miscellaneous Account</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Customer / Client Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sukkur Chamber of Commerce, Ali Hassan"
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
                placeholder="0321-7654321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Credit Limit (PKR)
              </label>
              <input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Initial Opening Receivable (PKR)
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
              Address (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Airport Road, Sukkur"
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
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

