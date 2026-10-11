import { Vendor, Customer, AgingBucket } from '../../types/party';
import { PurchaseInvoice } from '../../types/purchase';
import { SalesEntry } from '../../types/sales';
import { JournalEntry } from '../../types/accounting';
import { calculateVendorLedger, calculateCustomerLedger } from './ledger';
import { round2 } from '../utils/formatters';

export interface VendorBalanceSummary {
  vendorId: string;
  accountNo: string;
  name: string;
  category: string;
  totalDebit: number;
  totalCredit: number;
  netPayable: number; // When Credit > Debit
  advanceAmount: number; // When Debit > Credit
}

export interface CustomerBalanceSummary {
  customerId: string;
  accountNo: string;
  name: string;
  category: string;
  totalDebit: number;
  totalCredit: number;
  netReceivable: number; // When Debit > Credit
  advanceReceived: number; // When Credit > Debit
}

/**
 * Calculates payables and advances for all vendors
 */
export function calculateAllVendorBalances(
  vendors: Vendor[],
  journalEntries: JournalEntry[]
): {
  summaries: VendorBalanceSummary[];
  totalPayable: number;
  totalAdvances: number;
} {
  let totalPayable = 0;
  let totalAdvances = 0;

  const summaries = vendors.map((v) => {
    const { totalDebit, totalCredit, closingBalance, balanceNature } = calculateVendorLedger(v, journalEntries);

    const netPayable = balanceNature === 'CREDIT' ? closingBalance : 0;
    const advanceAmount = balanceNature === 'DEBIT' ? closingBalance : 0;

    totalPayable += netPayable;
    totalAdvances += advanceAmount;

    return {
      vendorId: v.id,
      accountNo: v.accountNo,
      name: v.name,
      category: v.category,
      totalDebit,
      totalCredit,
      netPayable: round2(netPayable),
      advanceAmount: round2(advanceAmount),
    };
  });

  return {
    summaries,
    totalPayable: round2(totalPayable),
    totalAdvances: round2(totalAdvances),
  };
}

/**
 * Calculates receivables for all customers
 */
export function calculateAllCustomerBalances(
  customers: Customer[],
  journalEntries: JournalEntry[]
): {
  summaries: CustomerBalanceSummary[];
  totalReceivable: number;
  totalAdvancesReceived: number;
} {
  let totalReceivable = 0;
  let totalAdvancesReceived = 0;

  const summaries = customers.map((c) => {
    const { totalDebit, totalCredit, closingBalance, balanceNature } = calculateCustomerLedger(c, journalEntries);

    const netReceivable = balanceNature === 'DEBIT' ? closingBalance : 0;
    const advanceReceived = balanceNature === 'CREDIT' ? closingBalance : 0;

    totalReceivable += netReceivable;
    totalAdvancesReceived += advanceReceived;

    return {
      customerId: c.id,
      accountNo: c.accountNo,
      name: c.name,
      category: c.category,
      totalDebit,
      totalCredit,
      netReceivable: round2(netReceivable),
      advanceReceived: round2(advanceReceived),
    };
  });

  return {
    summaries,
    totalReceivable: round2(totalReceivable),
    totalAdvancesReceived: round2(totalAdvancesReceived),
  };
}

/**
 * Calculates Aging Report for unpaid purchase invoices
 */
export function calculatePayablesAging(
  vendors: Vendor[],
  purchases: PurchaseInvoice[],
  asOfDate: string = new Date().toISOString().split('T')[0]
): AgingBucket[] {
  const asOfTime = new Date(asOfDate).getTime();

  return vendors.map((vendor) => {
    const vendorPurchases = purchases.filter((p) => p.vendorId === vendor.id && p.balanceAmount > 0 && p.isPosted);

    let current = 0;
    let days16to30 = 0;
    let days31to60 = 0;
    let daysOver60 = 0;

    for (const inv of vendorPurchases) {
      const invTime = new Date(inv.date).getTime();
      const diffDays = Math.max(0, Math.floor((asOfTime - invTime) / (1000 * 60 * 60 * 24)));

      if (diffDays <= 15) {
        current += inv.balanceAmount;
      } else if (diffDays <= 30) {
        days16to30 += inv.balanceAmount;
      } else if (diffDays <= 60) {
        days31to60 += inv.balanceAmount;
      } else {
        daysOver60 += inv.balanceAmount;
      }
    }

    const totalOutstanding = round2(current + days16to30 + days31to60 + daysOver60);

    return {
      partyId: vendor.id,
      partyName: vendor.name,
      accountNo: vendor.accountNo,
      current: round2(current),
      days16to30: round2(days16to30),
      days31to60: round2(days31to60),
      daysOver60: round2(daysOver60),
      totalOutstanding,
    };
  }).filter(b => b.totalOutstanding > 0);
}

