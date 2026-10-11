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
import { formatCurrency, formatDate } from '../../lib/utils/formatters';
import { PurchaseInvoice } from '../../types/purchase';

export default function PurchasesPage() {
  const { purchases, cancelPurchase } = useERPStorage();
  const toast = useToast();
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
      try {
        await cancelPurchase(invoiceId);
        setSelectedInvoice(null);
        toast.success('Invoice Cancelled', `Purchase invoice ${selectedInvoice?.invoiceNumber} cancelled and accounting reversed.`);
      } catch (err) {
        toast.error('Action Failed', 'Could not cancel invoice.');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success">Paid</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="warning">Partial</Badge>;
      case 'UNPAID':
        return <Badge variant="danger">Unpaid</Badge>;
      case 'CANCELLED':
        return <Badge variant="default">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <PageContainer
      title="Purchase Invoices"
      subtitle="Manage grocery, food ingredients, meat, and packaging supplier purchases"
      actions={
        <Link href="/purchases/new">
          <Button variant="primary" size="md">
            <Icons.Plus size={16} />
            <span>New Purchase Bill</span>
          </Button>
        </Link>
      }
    >
      {/* Search & Filters Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
              <input
                type="text"
                placeholder="Search by invoice number or vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <span className="text-[13px] font-semibold text-[#64748B] whitespace-nowrap">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 px-3.5 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none transition-all cursor-pointer"
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

      {/* Invoice List Table or Empty State */}
      {filteredPurchases.length === 0 ? (
        <EmptyState
          icon="ShoppingCart"
          title="No purchase invoices found"
          description="Record raw food materials, meat, poultry, vegetables, or store items from your registered vendors."
          action={
            <Link href="/purchases/new">
              <Button variant="primary">
                <Icons.Plus size={16} />
                <span>Create First Purchase Invoice</span>
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Payment Mode</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Net Total</TableHead>
              <TableHead className="text-right">Balance Due</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredPurchases.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-bold text-[#172554] font-mono">
                  {inv.invoiceNumber}
                </TableCell>
                <TableCell className="text-[#64748B]">{formatDate(inv.date)}</TableCell>
                <TableCell className="font-semibold text-[#172554]">{inv.vendorName}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-semibold ${
                    inv.paymentType === 'CASH' ? 'bg-[#ECFDF5] text-[#047857]' : 'bg-[#EFF6FF] text-[#1D4ED8]'
                  }`}>
                    {inv.paymentType === 'CASH' ? 'Cash in Hand' : 'Credit (AP)'}
                  </span>
                </TableCell>
                <TableCell className="text-[#64748B]">{formatDate(inv.dueDate)}</TableCell>
                <TableCell className="text-[#64748B]">{inv.items.length} line items</TableCell>
                <TableCell className="text-right font-bold text-[#172554] font-mono tabular-nums">
                  {formatCurrency(inv.netTotal)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  <span className={inv.balanceAmount > 0 ? 'text-[#C2410C] font-bold' : 'text-[#047857]'}>
                    {formatCurrency(inv.balanceAmount)}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(inv.paymentStatus)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedInvoice(inv)}
                  >
                    <Icons.Eye size={14} />
                    <span>View Bill</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          title={`Purchase Bill — ${selectedInvoice.invoiceNumber}`}
          description={`Issued by ${selectedInvoice.vendorName} on ${formatDate(selectedInvoice.date)}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Header Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[13px]">
              <div>
                <span className="text-[#64748B] block text-[11px] font-bold uppercase tracking-wider">Payment Mode</span>
                <span className="font-semibold text-[#172554] mt-0.5 block">{selectedInvoice.paymentType}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px] font-bold uppercase tracking-wider">Payment Status</span>
                <span className="mt-0.5 block">{getStatusBadge(selectedInvoice.paymentStatus)}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px] font-bold uppercase tracking-wider">Due Date</span>
                <span className="font-semibold text-[#172554] mt-0.5 block">{formatDate(selectedInvoice.dueDate)}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px] font-bold uppercase tracking-wider">Balance Due</span>
                <span className="font-bold text-[#C2410C] font-mono mt-0.5 block">{formatCurrency(selectedInvoice.balanceAmount)}</span>
              </div>
            </div>

            {/* Line items table */}
            <div>
              <h4 className="text-[13px] font-bold text-[#64748B] uppercase tracking-wider mb-2.5">Purchased Line Items</h4>
              <div className="rounded-xl border border-[#E2E8F0] overflow-hidden">
                <table className="w-full text-left text-[14px]">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-bold text-[#64748B] uppercase">
                    <tr>
                      <th className="px-4 py-3">Item Name</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Unit Rate</th>
                      <th className="px-4 py-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {selectedInvoice.items.map((line, idx) => (
                      <tr key={idx} className="hover:bg-[#F8FAFC]/60">
                        <td className="px-4 py-3 font-semibold text-[#172554]">
                          {line.itemName}
                          <span className="text-[#64748B] font-normal text-[12px] ml-1.5 font-mono">({line.itemCode})</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">{line.quantity} {line.unit}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">{formatCurrency(line.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-bold font-mono tabular-nums text-[#172554]">{formatCurrency(line.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#F8FAFC] border-t border-[#E2E8F0] font-bold text-[14px]">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right text-[#64748B]">Invoice Grand Total:</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-[#0F766E] text-base">
                        {formatCurrency(selectedInvoice.netTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {selectedInvoice.notes && (
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[13px]">
                <span className="font-semibold text-[#64748B]">Notes: </span>
                <span className="text-[#334155]">{selectedInvoice.notes}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
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
                <span className="text-[12px] text-[#64748B] italic">This invoice is already cancelled.</span>
              )}

              <Button variant="secondary" size="sm" onClick={() => setSelectedInvoice(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
