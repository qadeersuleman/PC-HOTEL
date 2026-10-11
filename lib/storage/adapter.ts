import { Item, ItemCategory, StockMovement, StockAdjustment } from '../../types/inventory';
import { Department, IssueInvoice } from '../../types/issue';
import { Vendor, Customer } from '../../types/party';
import { PurchaseInvoice } from '../../types/purchase';
import { Account, JournalEntry } from '../../types/accounting';
import { Voucher } from '../../types/voucher';
import { SalesEntry } from '../../types/sales';

/**
 * StorageAdapter interface
 * 
 * Defines the contract for all data persistence operations.
 * Phase 1-8: Implemented via LocalStorageAdapter.
 * Future migration: SQLiteAdapter (Server Actions / API endpoints) implements this exact interface.
 */
export interface StorageAdapter {
  // Master data
  getItems(): Promise<Item[]>;
  saveItem(item: Item): Promise<void>;
  deleteItem(id: string): Promise<void>;

  getCategories(): Promise<ItemCategory[]>;
  saveCategory(category: ItemCategory): Promise<void>;

  getDepartments(): Promise<Department[]>;
  saveDepartment(dept: Department): Promise<void>;

  getVendors(): Promise<Vendor[]>;
  saveVendor(vendor: Vendor): Promise<void>;

  getCustomers(): Promise<Customer[]>;
  saveCustomer(customer: Customer): Promise<void>;

  getAccounts(): Promise<Account[]>;
  saveAccount(account: Account): Promise<void>;

  // Transactions
  getPurchases(): Promise<PurchaseInvoice[]>;
  savePurchase(invoice: PurchaseInvoice): Promise<void>;
  cancelPurchase(invoiceId: string): Promise<void>;

  getIssues(): Promise<IssueInvoice[]>;
  saveIssue(issue: IssueInvoice): Promise<void>;
  cancelIssue(issueId: string): Promise<void>;

  getStockMovements(): Promise<StockMovement[]>;
  saveStockMovement(movement: StockMovement): Promise<void>;

  getStockAdjustments(): Promise<StockAdjustment[]>;
  saveStockAdjustment(adjustment: StockAdjustment): Promise<void>;

  getVouchers(): Promise<Voucher[]>;
  saveVoucher(voucher: Voucher): Promise<void>;
  cancelVoucher(voucherId: string): Promise<void>;

  getSales(): Promise<SalesEntry[]>;
  saveSales(sale: SalesEntry): Promise<void>;

  getJournalEntries(): Promise<JournalEntry[]>;
  saveJournalEntry(entry: JournalEntry): Promise<void>;

  // System management
  resetToSeed(): Promise<void>;
}

