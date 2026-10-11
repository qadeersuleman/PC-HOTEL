export type AccountCategory = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type NormalBalance = 'DEBIT' | 'CREDIT';

export interface Account {
  id: string;
  code: string; // e.g. 100100, 201900
  name: string;
  category: AccountCategory;
  subCategory?: string; // Current Assets, Non-Current, Cost of Sales, Operating Expense, etc.
  normalBalance: NormalBalance;
  description?: string;
  isSystem: boolean; // System accounts like Cash, Accounts Payable, Inventory cannot be deleted
  isActive: boolean;
}

export interface JournalEntry {
  id: string;
  entryNumber: string; // JE-0001
  date: string;
  sourceType: 'PURCHASE' | 'ISSUE' | 'VOUCHER' | 'SALES' | 'ADJUSTMENT' | 'OPENING';
  sourceId: string;
  sourceNumber: string;
  description: string;
  lines: {
    id: string;
    accountId: string;
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    partyId?: string;
    partyType?: 'VENDOR' | 'CUSTOMER';
    notes?: string;
  }[];
  totalAmount: number;
  isReversed?: boolean;
  createdAt: string;
}

export interface GeneralLedgerEntry {
  id: string;
  date: string;
  entryNumber: string;
  sourceType: string;
  sourceNumber: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  partyName?: string;
}

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  category: AccountCategory;
  debit: number;
  credit: number;
}

export interface TrialBalanceReport {
  date: string;
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

