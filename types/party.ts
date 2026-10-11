export type PartyType = 'VENDOR' | 'CUSTOMER';

export interface Vendor {
  id: string;
  accountNo: string; // e.g. '201910', '201923' from the restaurant reports
  name: string;
  category: string; // e.g., 'Gas', 'Mutton Supplier', 'Poultry', 'General'
  contactPerson?: string;
  phone?: string;
  address?: string;
  openingBalance: number; // Credit positive (we owe them), Debit positive if advance
  openingBalanceType: 'CREDIT' | 'DEBIT'; // CREDIT = Payable, DEBIT = Advance
  termsDays: number;
  isActive: boolean;
}

export interface Customer {
  id: string;
  accountNo: string; // e.g. '100511', '100512'
  name: string;
  category: 'RESTAURANT_GUEST' | 'CORPORATE' | 'EMPLOYEE' | 'MISC';
  phone?: string;
  address?: string;
  openingBalance: number;
  openingBalanceType: 'DEBIT' | 'CREDIT'; // DEBIT = Receivable, CREDIT = Customer Advance
  creditLimit?: number;
  isActive: boolean;
}

export interface PartyLedgerEntry {
  id: string;
  date: string;
  partyId: string;
  partyType: PartyType;
  referenceType: 'PURCHASE_INVOICE' | 'SALES_INVOICE' | 'PAYMENT_CPV' | 'RECEIPT_CRV' | 'JOURNAL_JV' | 'OPENING';
  referenceId: string;
  referenceNumber: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number; // Balance after this transaction
  balanceNature: 'DEBIT' | 'CREDIT' | 'NIL';
}

export interface AgingBucket {
  partyId: string;
  partyName: string;
  accountNo: string;
  current: number; // 0-15 days
  days16to30: number; // 16-30 days
  days31to60: number; // 31-60 days
  daysOver60: number; // >60 days
  totalOutstanding: number;
}

