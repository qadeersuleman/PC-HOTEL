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
import { formatCurrency, formatDate } from '../../lib/utils/formatters';
import { PurchaseInvoice } from '../../types/purchase';

export default function PurchasesPage() {
  const { purchases, cancelPurchase } = useERPStorage();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);

  const filteredPurchases = purchases.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.vendorName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCancelInvoice = async (invoiceId: string) => {
    if (confirm('Are you sure you want to cancel this purchase invoice? This will safely reverse the stock intake and accounting payable entries.')) {
      await cancelPurchase(invoiceId);
      setSelectedInvoice(null);
    }
  };

  return (
    <PageContainer
      title="Purchase Invoices"
      subtitle="Record and track raw materials, food ingredients, and packing procurement"
      actions={
        <Link href="/purchases/new">
          <Button variant="primary" size="sm">
            <Icons.Plus size={14} />
            <span>Create Purchase Invoice</span>
          </Button>
        </Link>
      }
    >
      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                placeholder="Search by invoice number or vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Payment Type</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total (PKR)</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredPurchases.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-10 text-center text-zinc-400 text-xs">
                  No purchase invoices found.
                </td>
              </tr>
            ) : (
              filteredPurchases.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {inv.invoiceNumber}
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(inv.date)}</TableCell>
                  <TableCell className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {inv.vendorName}
                  </TableCell>
                  <TableCell>
                    <Badge variant={inv.paymentType === 'CASH' ? 'success' : 'info'}>
                      {inv.paymentType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(inv.dueDate)}</TableCell>
                  <TableCell className="text-xs font-mono">{inv.items.length} item(s)</TableCell>
                  <TableCell className="font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(inv.netTotal)}
                  </TableCell>
                  <TableCell className="font-semibold text-amber-600 dark:text-amber-400">
                    {formatCurrency(inv.balanceAmount)}
                  </TableCell>
                  <TableCell>
                    {inv.paymentStatus === 'PAID' && <Badge variant="success">Paid</Badge>}
                    {inv.paymentStatus === 'PARTIALLY_PAID' && <Badge variant="warning">Partial</Badge>}
                    {inv.paymentStatus === 'UNPAID' && <Badge variant="danger">Unpaid</Badge>}
                    {inv.paymentStatus === 'CANCELLED' && <Badge variant="outline">Cancelled</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      title="View Details"
                    >
                      <Icons.Eye size={15} />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedInvoice(null)}
          title={`Purchase Invoice: ${selectedInvoice.invoiceNumber}`}
          description={`Issued to ${selectedInvoice.vendorName} on ${formatDate(selectedInvoice.date)}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-xs">
              <div>
                <span className="text-zinc-400 block">Payment Type</span>
                <span className="font-bold">{selectedInvoice.paymentType}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Payment Due</span>
                <span className="font-bold">{formatDate(selectedInvoice.dueDate)}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Total Net Amount</span>
                <span className="font-bold text-emerald-600">{formatCurrency(selectedInvoice.netTotal)}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Remaining Balance</span>
                <span className="font-bold text-amber-600">{formatCurrency(selectedInvoice.balanceAmount)}</span>
              </div>
            </div>

            {/* Line items table */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Line Total</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {selectedInvoice.items.map((li) => (
                    <TableRow key={li.id}>
                      <TableCell className="font-mono text-xs">{li.itemCode}</TableCell>
                      <TableCell className="font-semibold text-xs">{li.itemName}</TableCell>
                      <TableCell className="text-xs">{li.quantity} {li.unit}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(li.unitPrice)}</TableCell>
                      <TableCell className="font-bold text-xs">{formatCurrency(li.lineTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {selectedInvoice.notes && (
              <p className="text-xs text-zinc-500 italic">Notes: {selectedInvoice.notes}</p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
              {selectedInvoice.paymentStatus !== 'CANCELLED' ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleCancelInvoice(selectedInvoice.id)}
                >
                  <Icons.Trash2 size={14} />
                  <span>Cancel & Reverse Invoice</span>
                </Button>
              ) : (
                <Badge variant="outline">Invoice Cancelled</Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}

