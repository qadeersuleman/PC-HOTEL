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
import { IssueInvoice } from '../../types/issue';

export default function IssuesPage() {
  const { issues, cancelIssue, departments } = useERPStorage();
  const [search, setSearch] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<IssueInvoice | null>(null);

  const filteredIssues = issues.filter(
    (iss) =>
      iss.issueNumber.toLowerCase().includes(search.toLowerCase()) ||
      iss.departmentName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCancelIssue = async (issueId: string) => {
    if (confirm('Cancel this issue invoice? This will restore the deducted inventory to stock and reverse the accounting expense entry.')) {
      await cancelIssue(issueId);
      setSelectedIssue(null);
    }
  };

  return (
    <PageContainer
      title="Department Issue Invoices"
      subtitle="Track raw food items issued to kitchen chefs, bar counter, and packaging materials"
      actions={
        <Link href="/issues/new">
          <Button variant="primary" size="sm">
            <Icons.Plus size={14} />
            <span>Create Issue Invoice</span>
          </Button>
        </Link>
      }
    >
      <Card>
        <CardContent className="p-4">
          <div className="relative w-full sm:w-80">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search by issue number or department..."
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
              <TableHead>Issue #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Items Count</TableHead>
              <TableHead>Total Cost (PKR)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredIssues.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-zinc-400 text-xs">
                  No stock issue invoices found.
                </td>
              </tr>
            ) : (
              filteredIssues.map((iss) => {
                const dept = departments.find((d) => d.id === iss.departmentId);

                return (
                  <TableRow key={iss.id}>
                    <TableCell className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {iss.issueNumber}
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(iss.date)}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {iss.departmentName}
                      </span>
                      <span className="ml-2">
                        {dept?.isKitchen ? (
                          <Badge variant="success">COGS</Badge>
                        ) : (
                          <Badge variant="info">Expense</Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">{iss.destination || '—'}</TableCell>
                    <TableCell className="text-xs font-mono">{iss.items.length} item(s)</TableCell>
                    <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(iss.totalCost)}
                    </TableCell>
                    <TableCell>
                      {iss.isPosted ? <Badge variant="success">Posted</Badge> : <Badge variant="outline">Cancelled</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => setSelectedIssue(iss)}
                        className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="View Details"
                      >
                        <Icons.Eye size={15} />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Modal */}
      {selectedIssue && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedIssue(null)}
          title={`Stock Issue Invoice: ${selectedIssue.issueNumber}`}
          description={`Issued to ${selectedIssue.departmentName} on ${formatDate(selectedIssue.date)}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-xs">
              <div>
                <span className="text-zinc-400 block">Department</span>
                <span className="font-bold">{selectedIssue.departmentName}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Destination</span>
                <span className="font-bold">{selectedIssue.destination}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Total Issue Cost</span>
                <span className="font-bold text-emerald-600">{formatCurrency(selectedIssue.totalCost)}</span>
              </div>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Issued Qty</TableHead>
                    <TableHead>Avg Cost</TableHead>
                    <TableHead>Line Total</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {selectedIssue.items.map((li) => (
                    <TableRow key={li.id}>
                      <TableCell className="font-mono text-xs">{li.itemCode}</TableCell>
                      <TableCell className="font-semibold text-xs">{li.itemName}</TableCell>
                      <TableCell className="text-xs font-bold">{li.issueQuantity} {li.unit}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(li.unitCost)}</TableCell>
                      <TableCell className="font-bold text-xs">{formatCurrency(li.totalCost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {selectedIssue.notes && (
              <p className="text-xs text-zinc-500 italic">Notes: {selectedIssue.notes}</p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
              {selectedIssue.isPosted ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleCancelIssue(selectedIssue.id)}
                >
                  <Icons.Trash2 size={14} />
                  <span>Cancel & Restore Stock</span>
                </Button>
              ) : (
                <Badge variant="outline">Cancelled</Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedIssue(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}

