import { JournalEntry } from '../../types/accounting';
import { PurchaseInvoice } from '../../types/purchase';
import { IssueInvoice, Department } from '../../types/issue';
import { SalesEntry } from '../../types/sales';
import { Voucher } from '../../types/voucher';
import { StockAdjustment } from '../../types/inventory';
import { round2 } from '../utils/formatters';

/**
 * Validates that all lines in a journal entry sum to equal Debits and Credits
 */
export function validateJournalBalance(lines: { debit: number; credit: number }[]): { isBalanced: boolean; totalDebit: number; totalCredit: number; difference: number } {
  const totalDebit = round2(lines.reduce((sum, line) => sum + (line.debit || 0), 0));
  const totalCredit = round2(lines.reduce((sum, line) => sum + (line.credit || 0), 0));
  const difference = round2(Math.abs(totalDebit - totalCredit));
  return {
    isBalanced: difference < 0.01,
    totalDebit,
    totalCredit,
    difference,
  };
}

/**
 * Creates double-entry Journal Entry for a Purchase Invoice
 * 
 * Accounting Flow:
 * Debit:  100200 - Inventory Asset (Stores the purchased items)
 * Credit: 201900 - Accounts Payable (If Credit purchase) OR 100100 - Cash / Bank (If Cash purchase)
 */
export function createJournalForPurchase(invoice: PurchaseInvoice): JournalEntry {
  const isCash = invoice.paymentType === 'CASH';
  const lines = [
    {
      id: `jl-p-${invoice.id}-dr`,
      accountId: 'acc-100200',
      accountCode: '100200',
      accountName: 'Inventory Asset (Store Stock)',
      debit: invoice.netTotal,
      credit: 0,
      notes: `Purchase from ${invoice.vendorName} (${invoice.invoiceNumber})`,
    },
    {
      id: `jl-p-${invoice.id}-cr`,
      accountId: isCash ? 'acc-100100' : 'acc-201900',
      accountCode: isCash ? '100100' : '201900',
      accountName: isCash ? 'Cash in Hand (Counter)' : 'Accounts Payable (Vendors)',
      debit: 0,
      credit: invoice.netTotal,
      partyId: isCash ? undefined : invoice.vendorId,
      partyType: isCash ? undefined : ('VENDOR' as const),
      notes: isCash ? `Cash purchase: ${invoice.invoiceNumber}` : `Payable to ${invoice.vendorName}`,
    },
  ];

  return {
    id: `je-pi-${invoice.id}`,
    entryNumber: `JE-PI-${invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '')}`,
    date: invoice.date,
    sourceType: 'PURCHASE',
    sourceId: invoice.id,
    sourceNumber: invoice.invoiceNumber,
    description: `Purchase Invoice: ${invoice.invoiceNumber} - ${invoice.vendorName}`,
    lines,
    totalAmount: invoice.netTotal,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Creates double-entry Journal Entry for an Issue Invoice
 * 
 * Accounting Flow:
 * Debit:  COGS (if Kitchen) OR Operating Expense (if Packing/Housekeeping)
 * Credit: 100200 - Inventory Asset (Deducts stock value)
 */
export function createJournalForIssue(issue: IssueInvoice, department?: Department): JournalEntry {
  const expenseAccountId = department?.expenseAccountId || (department?.isKitchen ? 'acc-500100' : 'acc-600300');
  const expenseAccountCode = expenseAccountId === 'acc-500100' ? '500100' : '600300';
  const expenseAccountName = expenseAccountId === 'acc-500100' 
    ? 'Cost of Goods Sold (Kitchen Consumption)' 
    : 'Packaging & Disposables Expense';

  const lines = [
    {
      id: `jl-i-${issue.id}-dr`,
      accountId: expenseAccountId,
      accountCode: expenseAccountCode,
      accountName: expenseAccountName,
      debit: issue.totalCost,
      credit: 0,
      notes: `Issued to ${issue.departmentName} (${issue.issueNumber})`,
    },
    {
      id: `jl-i-${issue.id}-cr`,
      accountId: 'acc-100200',
      accountCode: '100200',
      accountName: 'Inventory Asset (Store Stock)',
      debit: 0,
      credit: issue.totalCost,
      notes: `Stock reduction for issue ${issue.issueNumber}`,
    },
  ];

  return {
    id: `je-iss-${issue.id}`,
    entryNumber: `JE-ISS-${issue.issueNumber.replace(/[^a-zA-Z0-9]/g, '')}`,
    date: issue.date,
    sourceType: 'ISSUE',
    sourceId: issue.id,
    sourceNumber: issue.issueNumber,
    description: `Issue Invoice: ${issue.issueNumber} to ${issue.departmentName}`,
    lines,
    totalAmount: issue.totalCost,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Creates double-entry Journal Entry for Daily Sales Entry
 * 
 * Accounting Flow:
 * Debit:  100100 - Cash / 100110 - Bank / 100500 - Accounts Receivable
 * Credit: 400100 - Restaurant Sales Revenue
 */
export function createJournalForSales(sales: SalesEntry): JournalEntry {
  const lines: JournalEntry['lines'] = [];

  if (sales.cashAmount > 0) {
    lines.push({
      id: `jl-sal-${sales.id}-cash`,
      accountId: 'acc-100100',
      accountCode: '100100',
      accountName: 'Cash in Hand (Counter)',
      debit: sales.cashAmount,
      credit: 0,
      notes: `Cash collection: ${sales.invoiceNumber}`,
    });
  }

  if (sales.bankAmount > 0) {
    lines.push({
      id: `jl-sal-${sales.id}-bank`,
      accountId: 'acc-100110',
      accountCode: '100110',
      accountName: 'Meezan Bank Operating A/C',
      debit: sales.bankAmount,
      credit: 0,
      notes: `Card/Bank collection: ${sales.invoiceNumber}`,
    });
  }

  if (sales.creditAmount > 0) {
    lines.push({
      id: `jl-sal-${sales.id}-ar`,
      accountId: 'acc-100500',
      accountCode: '100500',
      accountName: 'Accounts Receivable (Customers)',
      debit: sales.creditAmount,
      credit: 0,
      partyId: sales.customerId,
      partyType: 'CUSTOMER',
      notes: `Credit sale to ${sales.customerName || 'Customer'}`,
    });
  }

  lines.push({
    id: `jl-sal-${sales.id}-rev`,
    accountId: 'acc-400100',
    accountCode: '400100',
    accountName: 'Restaurant Sales Revenue',
    debit: 0,
    credit: sales.netSales,
    notes: `Sales revenue for ${sales.invoiceNumber} (${sales.channel})`,
  });

  return {
    id: `je-sal-${sales.id}`,
    entryNumber: `JE-SAL-${sales.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '')}`,
    date: sales.date,
    sourceType: 'SALES',
    sourceId: sales.id,
    sourceNumber: sales.invoiceNumber,
    description: `Sales Entry: ${sales.invoiceNumber} (${sales.channel})`,
    lines,
    totalAmount: sales.netSales,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Creates double-entry Journal Entry for a Voucher (CRV, CPV, JV)
 */
export function createJournalForVoucher(voucher: Voucher): JournalEntry {
  const lines = voucher.lines.map((l) => ({
    id: l.id,
    accountId: l.accountId,
    accountCode: l.accountCode,
    accountName: l.accountName,
    debit: l.debit,
    credit: l.credit,
    partyId: l.partyId,
    partyType: l.partyType,
    notes: l.description || voucher.description,
  }));

  return {
    id: `je-v-${voucher.id}`,
    entryNumber: `JE-${voucher.voucherNumber.replace(/[^a-zA-Z0-9]/g, '')}`,
    date: voucher.date,
    sourceType: 'VOUCHER',
    sourceId: voucher.id,
    sourceNumber: voucher.voucherNumber,
    description: `${voucher.voucherType}: ${voucher.voucherNumber} - ${voucher.description}`,
    lines,
    totalAmount: voucher.amount,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Creates double-entry Journal Entry for a Stock Wastage / Adjustment
 */
export function createJournalForAdjustment(adj: StockAdjustment): JournalEntry {
  const isLoss = adj.quantity < 0 || adj.type === 'WASTAGE' || adj.type === 'SPOILAGE' || adj.type === 'EXPIRED';
  const amount = Math.abs(adj.totalAmount);

  const lines = isLoss
    ? [
        {
          id: `jl-adj-${adj.id}-dr`,
          accountId: 'acc-600900',
          accountCode: '600900',
          accountName: 'Wastage & Spoilage Expense',
          debit: amount,
          credit: 0,
          notes: `${adj.type}: ${adj.reason}`,
        },
        {
          id: `jl-adj-${adj.id}-cr`,
          accountId: 'acc-100200',
          accountCode: '100200',
          accountName: 'Inventory Asset (Store Stock)',
          debit: 0,
          credit: amount,
          notes: `Stock reduction adjustment ${adj.adjustmentNumber}`,
        },
      ]
    : [
        {
          id: `jl-adj-${adj.id}-dr`,
          accountId: 'acc-100200',
          accountCode: '100200',
          accountName: 'Inventory Asset (Store Stock)',
          debit: amount,
          credit: 0,
          notes: `Physical inventory count surplus ${adj.adjustmentNumber}`,
        },
        {
          id: `jl-adj-${adj.id}-cr`,
          accountId: 'acc-400200',
          accountCode: '400200',
          accountName: 'Other Operating Income',
          debit: 0,
          credit: amount,
          notes: `Inventory gain: ${adj.reason}`,
        },
      ];

  return {
    id: `je-adj-${adj.id}`,
    entryNumber: `JE-ADJ-${adj.adjustmentNumber.replace(/[^a-zA-Z0-9]/g, '')}`,
    date: adj.date,
    sourceType: 'ADJUSTMENT',
    sourceId: adj.id,
    sourceNumber: adj.adjustmentNumber,
    description: `Stock Adjustment: ${adj.adjustmentNumber} (${adj.type})`,
    lines,
    totalAmount: amount,
    createdAt: new Date().toISOString(),
  };
}

