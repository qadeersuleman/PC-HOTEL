import { UnitOfMeasure } from './inventory';

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  isKitchen: boolean; // Kitchen issues contribute to Estimated COGS, non-kitchen to Operating Expenses
  expenseAccountId: string; // Associated P&L account
  isActive: boolean;
}

export interface IssueLineItem {
  id: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  unit: UnitOfMeasure;
  availableQuantity: number;
  issueQuantity: number;
  unitCost: number; // Snapshot of weighted average cost at time of issue
  totalCost: number;
  purpose?: string;
}

export interface IssueInvoice {
  id: string;
  issueNumber: string; // e.g. ISS-2026-001
  date: string; // YYYY-MM-DD
  departmentId: string;
  departmentName: string;
  items: IssueLineItem[];
  totalCost: number;
  destination: string;
  notes?: string;
  isPosted: boolean;
  createdAt: string;
}

