import { UnitOfMeasure } from './inventory';

export type PurchasePaymentType = 'CASH' | 'CREDIT' | 'BANK';
export type InvoicePaymentStatus = 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'CANCELLED';

export interface PurchaseLineItem {
  id: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  unit: UnitOfMeasure;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  lineTotal: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string; // e.g., PI-2026-001
  date: string; // YYYY-MM-DD
  vendorId: string;
  vendorName: string;
  paymentType: PurchasePaymentType;
  paymentTermsDays: number; // e.g., 0 for cash, 15/30 for credit
  dueDate: string; // YYYY-MM-DD
  items: PurchaseLineItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  netTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: InvoicePaymentStatus;
  notes?: string;
  isPosted: boolean;
  createdAt: string;
  updatedAt: string;
}

