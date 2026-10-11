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
import { Customer } from '../../types/party';

export default function CustomersPage() {
  const { customers, customerBalances, saveCustomer } = useERPStorage();
  const toast = useToast();
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.accountNo.includes(search) ||
      (c.phone && c.phone.includes(search))
  );

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Validation Error', 'Please enter customer or guest name.');
      return;
    }

    setIsSubmitting(true);
    try {
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
      toast.success('Customer Registered', `${newCustomer.name} added to credit accounts.`);
      setIsModalOpen(false);
      setName('');
      setAccountNo('');
      setPhone('');
      setAddress('');
      setOpeningBalance('0');
    } catch (err) {
      toast.error('Save Failed', 'Could not register customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Customers & Credit Accounts"
      subtitle="Manage corporate catering accounts, hotel guest credit ledgers, and dining accounts"
      actions={
        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
          <Icons.Plus size={16} />
          <span>Add Credit Customer</span>
        </Button>
      }
    >
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#64748B] uppercase tracking-wider font-bold">Credit Customers</span>
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#1D4ED8] shadow-2xs">
              <Icons.UserCheck size={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#172554] mt-2 font-mono tabular-nums">{customers.length} Accounts</p>
          <p className="text-[12px] text-[#64748B] mt-1">Authorized dining & corporate guests</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#64748B] uppercase tracking-wider font-bold">Total Accounts Receivable (AR)</span>
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#1D4ED8] shadow-2xs">
              <Icons.Receipt size={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#1D4ED8] mt-2 font-mono tabular-nums">
            {formatCurrency(customerBalances.totalReceivable)}
          </p>
          <p className="text-[12px] text-[#64748B] mt-1">Outstanding guest debit receivables</p>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="relative w-full sm:w-96">
            <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
            <input
              type="text"
              placeholder="Search by customer name, phone, or account #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table or EmptyState */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          icon="UserCheck"
          title="No customer credit accounts found"
          description="Register hotel guests, corporate clients, and banquets to track credit sales and receipts."
          action={
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              <Icons.Plus size={16} />
              <span>Register Customer</span>
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Account #</TableHead>
              <TableHead>Customer / Guest Name</TableHead>
              <TableHead>Account Type</TableHead>
              <TableHead>Phone / Mobile</TableHead>
              <TableHead className="text-right">Credit Limit</TableHead>
              <TableHead className="text-right">Receivable Balance</TableHead>
              <TableHead className="text-right">Ledger Statement</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((cust) => {
              const summary = customerBalances.summaries.find((s) => s.customerId === cust.id);
              const balance = summary?.netReceivable || 0;

              return (
                <TableRow key={cust.id}>
                  <TableCell className="font-mono font-bold text-[#172554]">{cust.accountNo}</TableCell>
                  <TableCell className="font-semibold text-[#172554]">
                    {cust.name}
                    {cust.address && <p className="text-[12px] text-[#64748B] font-normal truncate max-w-xs">{cust.address}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary" size="sm">{cust.category}</Badge>
                  </TableCell>
                  <TableCell className="text-[#64748B] font-mono">{cust.phone || '—'}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-[#64748B]">
                    {cust.creditLimit !== undefined ? formatCurrency(cust.creditLimit) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-bold font-mono tabular-nums">
                    <span className={balance > 0 ? 'text-[#1D4ED8]' : 'text-[#64748B]'}>
                      {formatCurrency(balance)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/accounts/customer-ledger?customerId=${cust.id}`}>
                      <Button variant="outline" size="sm">
                        <Icons.BookOpen size={14} />
                        <span>View Statement</span>
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Register Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Customer / Guest"
        description="Creates an Accounts Receivable sub-ledger profile with credit limit"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                Customer / Guest Name <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. VIP Corporate Guest or Banquet A/C"
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
                placeholder="e.g. 100510"
                className="w-full h-12 px-4 text-[15px] font-mono rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Customer['category'])}
                className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none cursor-pointer"
              >
                <option value="RESTAURANT_GUEST">Regular Restaurant Guest</option>
                <option value="CORPORATE">Corporate Catering Account</option>
                <option value="EMPLOYEE">Hotel Staff / Employee Food Credit</option>
                <option value="MISC">Miscellaneous Account</option>
              </select>
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
                Mobile / Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0321-9876543"
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
                Credit Limit (PKR)
              </label>
              <input
                type="number"
                step="any"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full h-12 px-4 text-[15px] font-mono tabular-nums rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[14px] font-semibold text-[#1E293B] mb-1.5">
              Address / Company Details
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Blue Area, Islamabad"
              className="w-full h-12 px-4 text-[15px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1F5F9]">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              <Icons.CheckCircle size={16} />
              <span>Save Customer</span>
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
