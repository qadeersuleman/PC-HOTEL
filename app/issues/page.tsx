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
import { IssueInvoice } from '../../types/issue';

export default function IssuesPage() {
  const { issues, cancelIssue, departments } = useERPStorage();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<IssueInvoice | null>(null);

  const filteredIssues = issues.filter(
    (iss) =>
      iss.issueNumber.toLowerCase().includes(search.toLowerCase()) ||
      iss.departmentName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCancelIssue = async (issueId: string) => {
    if (confirm('Cancel this issue invoice? This will restore the deducted inventory to stock and reverse the accounting expense entry.')) {
      try {
        await cancelIssue(issueId);
        setSelectedIssue(null);
        toast.success('Issue Cancelled', 'Deducted inventory restored to store stock.');
      } catch (err) {
        toast.error('Action Failed', 'Could not cancel issue invoice.');
      }
    }
  };

  return (
    <PageContainer
      title="Department Issue Invoices"
      subtitle="Track raw food items, spices, and packaging issued to Kitchen, BBQ, Bar, and Housekeeping"
      actions={
        <Link href="/issues/new">
          <Button variant="primary" size="md">
            <Icons.Plus size={16} />
            <span>Create Issue Invoice</span>
          </Button>
        </Link>
      }
    >
      {/* Search Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="relative w-full sm:w-96">
            <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
            <input
              type="text"
              placeholder="Search by issue number or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-[14px] rounded-xl border border-[#E2E8F0] bg-white text-[#334155] placeholder-[#94A3B8] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* Issues Table or EmptyState */}
      {filteredIssues.length === 0 ? (
        <EmptyState
          icon="ArrowUpRight"
          title="No store issue invoices found"
          description="Issue ingredients to the Kitchen station, BBQ counter, or packaging supplies to the packing station."
          action={
            <Link href="/issues/new">
              <Button variant="primary">
                <Icons.Plus size={16} />
                <span>Create First Issue Invoice</span>
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Issue #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Destination Station</TableHead>
              <TableHead>Line Items</TableHead>
              <TableHead className="text-right">Issued Valuation</TableHead>
              <TableHead className="text-center">Accounting Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredIssues.map((iss) => {
              const dept = departments.find((d) => d.id === iss.departmentId);

              return (
                <TableRow key={iss.id}>
                  <TableCell className="font-bold text-[#172554] font-mono">
                    {iss.issueNumber}
                  </TableCell>
                  <TableCell className="text-[#64748B]">{formatDate(iss.date)}</TableCell>
                  <TableCell>
                    <span className="font-semibold text-[#172554]">{iss.departmentName}</span>
                  </TableCell>
                  <TableCell className="text-[#64748B]">{iss.destination || 'Station Store'}</TableCell>
                  <TableCell className="text-[#64748B]">{iss.items.length} items</TableCell>
                  <TableCell className="text-right font-bold text-[#172554] font-mono tabular-nums">
                    {formatCurrency(iss.totalCost)}
                  </TableCell>
                  <TableCell className="text-center">
                    {dept?.isKitchen ? (
                      <Badge variant="success">Food Cost (COGS)</Badge>
                    ) : (
                      <Badge variant="info">Operating Supply</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIssue(iss)}
                    >
                      <Icons.Eye size={14} />
                      <span>View Voucher</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <Modal
          isOpen={Boolean(selectedIssue)}
          onClose={() => setSelectedIssue(null)}
          title={`Department Issue Voucher — ${selectedIssue.issueNumber}`}
          description={`Transferred to ${selectedIssue.departmentName} on ${formatDate(selectedIssue.date)}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[13px]">
              <div>
                <span className="text-[#64748B] block text-[11px] font-bold uppercase tracking-wider">Department</span>
                <span className="font-semibold text-[#172554] mt-0.5 block">{selectedIssue.departmentName}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px] font-bold uppercase tracking-wider">Destination</span>
                <span className="font-semibold text-[#172554] mt-0.5 block">{selectedIssue.destination || 'Main Counter'}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px] font-bold uppercase tracking-wider">Issue Valuation</span>
                <span className="font-bold text-[#0F766E] font-mono text-[14px] mt-0.5 block">
                  {formatCurrency(selectedIssue.totalCost)}
                </span>
              </div>
            </div>

            {/* Line items table */}
            <div>
              <h4 className="text-[13px] font-bold text-[#64748B] uppercase tracking-wider mb-2.5">Issued Stock Items</h4>
              <div className="rounded-xl border border-[#E2E8F0] overflow-hidden">
                <table className="w-full text-left text-[14px]">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-bold text-[#64748B] uppercase">
                    <tr>
                      <th className="px-4 py-3">Item Name</th>
                      <th className="px-4 py-3 text-right">Quantity Issued</th>
                      <th className="px-4 py-3 text-right">Unit Cost</th>
                      <th className="px-4 py-3 text-right">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {selectedIssue.items.map((line, idx) => (
                      <tr key={idx} className="hover:bg-[#F8FAFC]/60">
                        <td className="px-4 py-3 font-semibold text-[#172554]">
                          {line.itemName}
                          <span className="text-[#64748B] font-normal text-[12px] ml-1.5 font-mono">({line.itemCode})</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">{line.issueQuantity} {line.unit}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">{formatCurrency(line.unitCost)}</td>
                        <td className="px-4 py-3 text-right font-bold font-mono tabular-nums text-[#172554]">{formatCurrency(line.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#F8FAFC] border-t border-[#E2E8F0] font-bold text-[14px]">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right text-[#64748B]">Total Issued Cost:</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-[#0F766E] text-base">
                        {formatCurrency(selectedIssue.totalCost)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {selectedIssue.notes && (
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[13px]">
                <span className="font-semibold text-[#64748B]">Issue Memo: </span>
                <span className="text-[#334155]">{selectedIssue.notes}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
              {selectedIssue.isPosted ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleCancelIssue(selectedIssue.id)}
                >
                  <Icons.Trash2 size={14} />
                  <span>Cancel & Return Stock to Store</span>
                </Button>
              ) : (
                <span className="text-[12px] text-[#64748B] italic">This issue voucher has been cancelled.</span>
              )}

              <Button variant="secondary" size="sm" onClick={() => setSelectedIssue(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
