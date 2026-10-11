export type SalesChannel = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'CATERING';
export type SalesPaymentMethod = 'CASH' | 'CARD' | 'ONLINE' | 'CREDIT';

export interface SalesEntry {
  id: string;
  invoiceNumber: string; // e.g. SAL-2026-001
  date: string; // YYYY-MM-DD
  channel: SalesChannel;
  grossSales: number;
  discount: number;
  netSales: number;
  tax: number;
  totalReceivable: number;
  paymentMethod: SalesPaymentMethod;
  customerId?: string; // Required if paymentMethod === 'CREDIT'
  customerName?: string;
  cashAmount: number;
  bankAmount: number;
  creditAmount: number;
  notes?: string;
  isPosted: boolean;
  createdAt: string;
}

