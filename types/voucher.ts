export type VoucherType = 'CRV' | 'CPV' | 'JV';

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
  partyId?: string; // Optional party link (vendor or customer)
  partyType?: 'VENDOR' | 'CUSTOMER';
  invoiceId?: string; // Optional link to specific purchase or sales invoice
}

export interface Voucher {
  id: string;
  voucherNumber: string; // CRV-0001, CPV-0001, JV-0001
  voucherType: VoucherType;
  date: string; // YYYY-MM-DD
  description: string;
  referenceNo?: string; // Cheque number, online transfer ref, bill no
  amount: number;
  // For CRV / CPV specific party & cash/bank mapping
  partyId?: string;
  partyType?: 'VENDOR' | 'CUSTOMER';
  paymentMethod?: 'CASH' | 'BANK' | 'ONLINE';
  bankAccountId?: string;
  allocatedInvoiceId?: string; // Invoice settled
  lines: JournalLine[]; // Full double-entry lines
  isPosted: boolean;
  createdAt: string;
  updatedAt: string;
}

