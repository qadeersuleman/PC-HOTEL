import { Account, JournalEntry, GeneralLedgerEntry } from '../../types/accounting';
import { Vendor, Customer, PartyLedgerEntry } from '../../types/party';
import { round2 } from '../utils/formatters';

/**
 * Calculates General Ledger entries for a specific account with running balance
 */
export function calculateAccountGeneralLedger(
  account: Account,
  journalEntries: JournalEntry[],
  startDate?: string,
  endDate?: string
): { entries: GeneralLedgerEntry[]; totalDebit: number; totalCredit: number; closingBalance: number } {
  // Sort journal entries by date ascending
  const sorted = [...journalEntries].sort((a, b) => a.date.localeCompare(b.date));

  let runningBalance = 0;
  let totalDebit = 0;
  let totalCredit = 0;
  const entries: GeneralLedgerEntry[] = [];

  for (const je of sorted) {
    if (startDate && je.date < startDate) continue;
    if (endDate && je.date > endDate) continue;

    const matchingLines = je.lines.filter((l) => l.accountId === account.id || l.accountCode === account.code);

    for (const line of matchingLines) {
      const dr = line.debit || 0;
      const cr = line.credit || 0;

      totalDebit += dr;
      totalCredit += cr;

      // Normal balance:
      // Asset & Expense increase with Debit, decrease with Credit
      // Liability, Equity, Revenue increase with Credit, decrease with Debit
      if (account.category === 'ASSET' || account.category === 'EXPENSE') {
        runningBalance = round2(runningBalance + dr - cr);
      } else {
        runningBalance = round2(runningBalance + cr - dr);
      }

      entries.push({
        id: line.id,
        date: je.date,
        entryNumber: je.entryNumber,
        sourceType: je.sourceType,
        sourceNumber: je.sourceNumber,
        description: line.notes || je.description,
        debit: dr,
        credit: cr,
        balance: runningBalance,
      });
    }
  }

  return {
    entries,
    totalDebit: round2(totalDebit),
    totalCredit: round2(totalCredit),
    closingBalance: round2(runningBalance),
  };
}

/**
 * Calculates the chronological Vendor Ledger
 * For Vendors:
 * Normal Liability: Credit balance means we owe them (Accounts Payable).
 * Debit balance means we overpaid / gave advance (Vendor Advance).
 */
export function calculateVendorLedger(
  vendor: Vendor,
  journalEntries: JournalEntry[],
  startDate?: string,
  endDate?: string
): { entries: PartyLedgerEntry[]; totalDebit: number; totalCredit: number; closingBalance: number; balanceNature: 'CREDIT' | 'DEBIT' | 'NIL' } {
  let runningBalance = 0;
  let totalDebit = 0;
  let totalCredit = 0;
  const entries: PartyLedgerEntry[] = [];

  // 1. Initial Opening Balance
  if (vendor.openingBalance > 0) {
    if (vendor.openingBalanceType === 'CREDIT') {
      runningBalance = vendor.openingBalance;
      totalCredit += vendor.openingBalance;
    } else {
      runningBalance = -vendor.openingBalance; // Debit advance
      totalDebit += vendor.openingBalance;
    }

    entries.push({
      id: `ob-${vendor.id}`,
      date: '2026-08-01',
      partyId: vendor.id,
      partyType: 'VENDOR',
      referenceType: 'OPENING',
      referenceId: vendor.id,
      referenceNumber: `OB-${vendor.accountNo}`,
      description: 'Opening Balance brought forward',
      debit: vendor.openingBalanceType === 'DEBIT' ? vendor.openingBalance : 0,
      credit: vendor.openingBalanceType === 'CREDIT' ? vendor.openingBalance : 0,
      runningBalance: Math.abs(runningBalance),
      balanceNature: runningBalance > 0 ? 'CREDIT' : runningBalance < 0 ? 'DEBIT' : 'NIL',
    });
  }

  // 2. Add journal lines referencing this vendor
  const sorted = [...journalEntries].sort((a, b) => a.date.localeCompare(b.date));

  for (const je of sorted) {
    if (je.sourceType === 'OPENING') continue; // Skip opening if already added
    if (startDate && je.date < startDate) continue;
    if (endDate && je.date > endDate) continue;

    const vendorLines = je.lines.filter((l) => l.partyId === vendor.id);

    for (const line of vendorLines) {
      const dr = line.debit || 0;
      const cr = line.credit || 0;

      totalDebit += dr;
      totalCredit += cr;

      // Credit increases payable (we owe them), Debit reduces payable / creates advance
      runningBalance = round2(runningBalance + cr - dr);

      entries.push({
        id: line.id,
        date: je.date,
        partyId: vendor.id,
        partyType: 'VENDOR',
        referenceType: je.sourceType === 'PURCHASE' ? 'PURCHASE_INVOICE' : je.sourceType === 'VOUCHER' ? 'PAYMENT_CPV' : 'JOURNAL_JV',
        referenceId: je.sourceId,
        referenceNumber: je.sourceNumber,
        description: line.notes || je.description,
        debit: dr,
        credit: cr,
        runningBalance: Math.abs(runningBalance),
        balanceNature: runningBalance > 0 ? 'CREDIT' : runningBalance < 0 ? 'DEBIT' : 'NIL',
      });
    }
  }

  return {
    entries,
    totalDebit: round2(totalDebit),
    totalCredit: round2(totalCredit),
    closingBalance: Math.abs(runningBalance),
    balanceNature: runningBalance > 0 ? 'CREDIT' : runningBalance < 0 ? 'DEBIT' : 'NIL',
  };
}

/**
 * Calculates Customer Ledger
 * Normal Asset: Debit balance means customer owes us (Accounts Receivable).
 * Credit balance means customer advance.
 */
export function calculateCustomerLedger(
  customer: Customer,
  journalEntries: JournalEntry[],
  startDate?: string,
  endDate?: string
): { entries: PartyLedgerEntry[]; totalDebit: number; totalCredit: number; closingBalance: number; balanceNature: 'DEBIT' | 'CREDIT' | 'NIL' } {
  let runningBalance = 0;
  let totalDebit = 0;
  let totalCredit = 0;
  const entries: PartyLedgerEntry[] = [];

  // Opening balance
  if (customer.openingBalance > 0) {
    if (customer.openingBalanceType === 'DEBIT') {
      runningBalance = customer.openingBalance;
      totalDebit += customer.openingBalance;
    } else {
      runningBalance = -customer.openingBalance;
      totalCredit += customer.openingBalance;
    }

    entries.push({
      id: `ob-${customer.id}`,
      date: '2026-08-01',
      partyId: customer.id,
      partyType: 'CUSTOMER',
      referenceType: 'OPENING',
      referenceId: customer.id,
      referenceNumber: `OB-${customer.accountNo}`,
      description: 'Opening Balance brought forward',
      debit: customer.openingBalanceType === 'DEBIT' ? customer.openingBalance : 0,
      credit: customer.openingBalanceType === 'CREDIT' ? customer.openingBalance : 0,
      runningBalance: Math.abs(runningBalance),
      balanceNature: runningBalance > 0 ? 'DEBIT' : runningBalance < 0 ? 'CREDIT' : 'NIL',
    });
  }

  const sorted = [...journalEntries].sort((a, b) => a.date.localeCompare(b.date));

  for (const je of sorted) {
    if (je.sourceType === 'OPENING') continue;
    if (startDate && je.date < startDate) continue;
    if (endDate && je.date > endDate) continue;

    const customerLines = je.lines.filter((l) => l.partyId === customer.id);

    for (const line of customerLines) {
      const dr = line.debit || 0;
      const cr = line.credit || 0;

      totalDebit += dr;
      totalCredit += cr;

      // Debit increases receivable (they owe us), Credit decreases receivable
      runningBalance = round2(runningBalance + dr - cr);

      entries.push({
        id: line.id,
        date: je.date,
        partyId: customer.id,
        partyType: 'CUSTOMER',
        referenceType: je.sourceType === 'SALES' ? 'SALES_INVOICE' : je.sourceType === 'VOUCHER' ? 'RECEIPT_CRV' : 'JOURNAL_JV',
        referenceId: je.sourceId,
        referenceNumber: je.sourceNumber,
        description: line.notes || je.description,
        debit: dr,
        credit: cr,
        runningBalance: Math.abs(runningBalance),
        balanceNature: runningBalance > 0 ? 'DEBIT' : runningBalance < 0 ? 'CREDIT' : 'NIL',
      });
    }
  }

  return {
    entries,
    totalDebit: round2(totalDebit),
    totalCredit: round2(totalCredit),
    closingBalance: Math.abs(runningBalance),
    balanceNature: runningBalance > 0 ? 'DEBIT' : runningBalance < 0 ? 'CREDIT' : 'NIL',
  };
}

