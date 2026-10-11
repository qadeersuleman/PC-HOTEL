import { StorageAdapter } from './adapter';
import { Item, ItemCategory, StockMovement, StockAdjustment } from '../../types/inventory';
import { Department, IssueInvoice } from '../../types/issue';
import { Vendor, Customer } from '../../types/party';
import { PurchaseInvoice } from '../../types/purchase';
import { Account, JournalEntry } from '../../types/accounting';
import { Voucher } from '../../types/voucher';
import { SalesEntry } from '../../types/sales';
import {
  INITIAL_CATEGORIES,
  INITIAL_DEPARTMENTS,
  INITIAL_ITEMS,
  INITIAL_VENDORS,
  INITIAL_CUSTOMERS,
  INITIAL_ACCOUNTS,
  INITIAL_PURCHASES,
  INITIAL_ISSUES,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_VOUCHERS,
  INITIAL_SALES,
  INITIAL_JOURNAL_ENTRIES,
} from '../../data/seed-data';
import { calculateWeightedAverageCost } from '../inventory/valuation';
import {
  createJournalForPurchase,
  createJournalForIssue,
  createJournalForSales,
  createJournalForVoucher,
  createJournalForAdjustment,
} from '../accounting/posting';

const STORAGE_KEYS = {
  ITEMS: 'erp_items_v2_clean',
  CATEGORIES: 'erp_categories_v2_clean',
  DEPARTMENTS: 'erp_departments_v2_clean',
  VENDORS: 'erp_vendors_v2_clean',
  CUSTOMERS: 'erp_customers_v2_clean',
  ACCOUNTS: 'erp_accounts_v2_clean',
  PURCHASES: 'erp_purchases_v2_clean',
  ISSUES: 'erp_issues_v2_clean',
  STOCK_MOVEMENTS: 'erp_stock_movements_v2_clean',
  STOCK_ADJUSTMENTS: 'erp_stock_adjustments_v2_clean',
  VOUCHERS: 'erp_vouchers_v2_clean',
  SALES: 'erp_sales_v2_clean',
  JOURNALS: 'erp_journals_v2_clean',
  INITIALIZED: 'erp_seeded_v2_clean',
};

function safeGet<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  constructor() {
    this.ensureInitialized();
  }

  public ensureInitialized(): void {
    if (typeof window === 'undefined') return;
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInit) {
      this.resetToSeedSync();
    }
  }

  public resetToSeedSync(): void {
    // Purge legacy v1 dummy keys
    const legacyKeys = [
      'erp_items_v1', 'erp_categories_v1', 'erp_departments_v1', 'erp_vendors_v1',
      'erp_customers_v1', 'erp_accounts_v1', 'erp_purchases_v1', 'erp_issues_v1',
      'erp_stock_movements_v1', 'erp_stock_adjustments_v1', 'erp_vouchers_v1',
      'erp_sales_v1', 'erp_journals_v1', 'erp_seeded_v1'
    ];
    if (typeof window !== 'undefined') {
      legacyKeys.forEach((k) => localStorage.removeItem(k));
    }

    safeSet(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
    safeSet(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    safeSet(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    safeSet(STORAGE_KEYS.VENDORS, INITIAL_VENDORS);
    safeSet(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    safeSet(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    safeSet(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
    safeSet(STORAGE_KEYS.ISSUES, INITIAL_ISSUES);
    safeSet(STORAGE_KEYS.STOCK_MOVEMENTS, INITIAL_STOCK_MOVEMENTS);
    safeSet(STORAGE_KEYS.STOCK_ADJUSTMENTS, []);
    safeSet(STORAGE_KEYS.VOUCHERS, INITIAL_VOUCHERS);
    safeSet(STORAGE_KEYS.SALES, INITIAL_SALES);
    safeSet(STORAGE_KEYS.JOURNALS, INITIAL_JOURNAL_ENTRIES);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  }

  async resetToSeed(): Promise<void> {
    this.resetToSeedSync();
  }

  // --- Items ---
  async getItems(): Promise<Item[]> {
    return safeGet<Item[]>(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
  }

  async saveItem(item: Item): Promise<void> {
    const items = await this.getItems();
    const index = items.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
    safeSet(STORAGE_KEYS.ITEMS, items);
  }

  async deleteItem(id: string): Promise<void> {
    const items = (await this.getItems()).filter((i) => i.id !== id);
    safeSet(STORAGE_KEYS.ITEMS, items);
  }

  // --- Categories ---
  async getCategories(): Promise<ItemCategory[]> {
    return safeGet<ItemCategory[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }

  async saveCategory(category: ItemCategory): Promise<void> {
    const list = await this.getCategories();
    const index = list.findIndex((c) => c.id === category.id);
    if (index >= 0) {
      list[index] = category;
    } else {
      list.push(category);
    }
    safeSet(STORAGE_KEYS.CATEGORIES, list);
  }

  // --- Departments ---
  async getDepartments(): Promise<Department[]> {
    return safeGet<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  }

  async saveDepartment(dept: Department): Promise<void> {
    const list = await this.getDepartments();
    const index = list.findIndex((d) => d.id === dept.id);
    if (index >= 0) {
      list[index] = dept;
    } else {
      list.push(dept);
    }
    safeSet(STORAGE_KEYS.DEPARTMENTS, list);
  }

  // --- Vendors ---
  async getVendors(): Promise<Vendor[]> {
    return safeGet<Vendor[]>(STORAGE_KEYS.VENDORS, INITIAL_VENDORS);
  }

  async saveVendor(vendor: Vendor): Promise<void> {
    const list = await this.getVendors();
    const index = list.findIndex((v) => v.id === vendor.id);
    if (index >= 0) {
      list[index] = vendor;
    } else {
      list.push(vendor);
    }
    safeSet(STORAGE_KEYS.VENDORS, list);
  }

  // --- Customers ---
  async getCustomers(): Promise<Customer[]> {
    return safeGet<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }

  async saveCustomer(customer: Customer): Promise<void> {
    const list = await this.getCustomers();
    const index = list.findIndex((c) => c.id === customer.id);
    if (index >= 0) {
      list[index] = customer;
    } else {
      list.push(customer);
    }
    safeSet(STORAGE_KEYS.CUSTOMERS, list);
  }

  // --- Accounts ---
  async getAccounts(): Promise<Account[]> {
    return safeGet<Account[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  }

  async saveAccount(account: Account): Promise<void> {
    const list = await this.getAccounts();
    const index = list.findIndex((a) => a.id === account.id);
    if (index >= 0) {
      list[index] = account;
    } else {
      list.push(account);
    }
    safeSet(STORAGE_KEYS.ACCOUNTS, list);
  }

  // --- Purchases & Automated Stock / Posting ---
  async getPurchases(): Promise<PurchaseInvoice[]> {
    return safeGet<PurchaseInvoice[]>(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
  }

  async savePurchase(invoice: PurchaseInvoice): Promise<void> {
    const purchases = await this.getPurchases();
    const items = await this.getItems();
    const movements = await this.getStockMovements();
    const journals = await this.getJournalEntries();

    const existingIndex = purchases.findIndex((p) => p.id === invoice.id);
    if (existingIndex >= 0) {
      purchases[existingIndex] = invoice;
    } else {
      purchases.unshift(invoice);
    }
    safeSet(STORAGE_KEYS.PURCHASES, purchases);

    // If posted, update stock movements, re-average item costs, and post balanced Journal Entry
    if (invoice.isPosted) {
      // 1. Remove previous movements for this invoice if any
      const filteredMovements = movements.filter((m) => m.referenceId !== invoice.id);

      for (const line of invoice.items) {
        filteredMovements.push({
          id: `sm-pi-${invoice.id}-${line.itemId}`,
          itemId: line.itemId,
          movementType: 'PURCHASE',
          quantity: line.quantity,
          unitCost: line.unitPrice,
          totalCost: line.lineTotal,
          referenceType: 'PURCHASE_INVOICE',
          referenceId: invoice.id,
          referenceNumber: invoice.invoiceNumber,
          date: invoice.date,
          createdAt: new Date().toISOString(),
          notes: `Purchased from ${invoice.vendorName}`,
        });

        // Update item Weighted Average Cost
        const itemIdx = items.findIndex((i) => i.id === line.itemId);
        if (itemIdx >= 0) {
          const item = items[itemIdx];
          const newAvgCost = calculateWeightedAverageCost(0, item.costPrice, line.quantity, line.unitPrice);
          items[itemIdx] = { ...item, costPrice: newAvgCost };
        }
      }

      safeSet(STORAGE_KEYS.STOCK_MOVEMENTS, filteredMovements);
      safeSet(STORAGE_KEYS.ITEMS, items);

      // 2. Post Journal Entry
      const je = createJournalForPurchase(invoice);
      const filteredJournals = journals.filter((j) => j.sourceId !== invoice.id);
      filteredJournals.push(je);
      safeSet(STORAGE_KEYS.JOURNALS, filteredJournals);
    }
  }

  async cancelPurchase(invoiceId: string): Promise<void> {
    const purchases = await this.getPurchases();
    const target = purchases.find((p) => p.id === invoiceId);
    if (!target) return;

    target.paymentStatus = 'CANCELLED';
    target.isPosted = false;
    safeSet(STORAGE_KEYS.PURCHASES, purchases);

    // Remove stock movements and journal entries for this invoice
    const movements = (await this.getStockMovements()).filter((m) => m.referenceId !== invoiceId);
    safeSet(STORAGE_KEYS.STOCK_MOVEMENTS, movements);

    const journals = (await this.getJournalEntries()).filter((j) => j.sourceId !== invoiceId);
    safeSet(STORAGE_KEYS.JOURNALS, journals);
  }

  // --- Issues & Department Allocation ---
  async getIssues(): Promise<IssueInvoice[]> {
    return safeGet<IssueInvoice[]>(STORAGE_KEYS.ISSUES, INITIAL_ISSUES);
  }

  async saveIssue(issue: IssueInvoice): Promise<void> {
    const issues = await this.getIssues();
    const movements = await this.getStockMovements();
    const journals = await this.getJournalEntries();
    const departments = await this.getDepartments();

    const existingIndex = issues.findIndex((i) => i.id === issue.id);
    if (existingIndex >= 0) {
      issues[existingIndex] = issue;
    } else {
      issues.unshift(issue);
    }
    safeSet(STORAGE_KEYS.ISSUES, issues);

    if (issue.isPosted) {
      const filteredMovements = movements.filter((m) => m.referenceId !== issue.id);

      for (const line of issue.items) {
        filteredMovements.push({
          id: `sm-iss-${issue.id}-${line.itemId}`,
          itemId: line.itemId,
          movementType: 'ISSUE',
          quantity: line.issueQuantity,
          unitCost: line.unitCost,
          totalCost: line.totalCost,
          referenceType: 'ISSUE_INVOICE',
          referenceId: issue.id,
          referenceNumber: issue.issueNumber,
          date: issue.date,
          departmentId: issue.departmentId,
          createdAt: new Date().toISOString(),
          notes: `Issued to ${issue.departmentName}`,
        });
      }

      safeSet(STORAGE_KEYS.STOCK_MOVEMENTS, filteredMovements);

      // Post Journal Entry
      const dept = departments.find((d) => d.id === issue.departmentId);
      const je = createJournalForIssue(issue, dept);
      const filteredJournals = journals.filter((j) => j.sourceId !== issue.id);
      filteredJournals.push(je);
      safeSet(STORAGE_KEYS.JOURNALS, filteredJournals);
    }
  }

  async cancelIssue(issueId: string): Promise<void> {
    const issues = await this.getIssues();
    const target = issues.find((i) => i.id === issueId);
    if (!target) return;

    target.isPosted = false;
    safeSet(STORAGE_KEYS.ISSUES, issues);

    const movements = (await this.getStockMovements()).filter((m) => m.referenceId !== issueId);
    safeSet(STORAGE_KEYS.STOCK_MOVEMENTS, movements);

    const journals = (await this.getJournalEntries()).filter((j) => j.sourceId !== issueId);
    safeSet(STORAGE_KEYS.JOURNALS, journals);
  }

  // --- Movements & Adjustments ---
  async getStockMovements(): Promise<StockMovement[]> {
    return safeGet<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, INITIAL_STOCK_MOVEMENTS);
  }

  async saveStockMovement(movement: StockMovement): Promise<void> {
    const movements = await this.getStockMovements();
    movements.push(movement);
    safeSet(STORAGE_KEYS.STOCK_MOVEMENTS, movements);
  }

  async getStockAdjustments(): Promise<StockAdjustment[]> {
    return safeGet<StockAdjustment[]>(STORAGE_KEYS.STOCK_ADJUSTMENTS, []);
  }

  async saveStockAdjustment(adjustment: StockAdjustment): Promise<void> {
    const list = await this.getStockAdjustments();
    const movements = await this.getStockMovements();
    const journals = await this.getJournalEntries();

    list.unshift(adjustment);
    safeSet(STORAGE_KEYS.STOCK_ADJUSTMENTS, list);

    if (adjustment.isPosted) {
      const isPositive = adjustment.quantity > 0;
      movements.push({
        id: `sm-adj-${adjustment.id}`,
        itemId: adjustment.itemId,
        movementType: isPositive ? 'ADJUSTMENT_ADD' : adjustment.type === 'WASTAGE' ? 'WASTAGE' : 'ADJUSTMENT_DEDUCT',
        quantity: Math.abs(adjustment.quantity),
        unitCost: adjustment.unitCost,
        totalCost: Math.abs(adjustment.totalAmount),
        referenceType: 'STOCK_ADJUSTMENT',
        referenceId: adjustment.id,
        referenceNumber: adjustment.adjustmentNumber,
        date: adjustment.date,
        createdAt: new Date().toISOString(),
        notes: `${adjustment.type}: ${adjustment.reason}`,
      });
      safeSet(STORAGE_KEYS.STOCK_MOVEMENTS, movements);

      const je = createJournalForAdjustment(adjustment);
      journals.push(je);
      safeSet(STORAGE_KEYS.JOURNALS, journals);
    }
  }

  // --- Vouchers (CRV, CPV, JV) ---
  async getVouchers(): Promise<Voucher[]> {
    return safeGet<Voucher[]>(STORAGE_KEYS.VOUCHERS, INITIAL_VOUCHERS);
  }

  async saveVoucher(voucher: Voucher): Promise<void> {
    const vouchers = await this.getVouchers();
    const journals = await this.getJournalEntries();
    const purchases = await this.getPurchases();

    const existingIndex = vouchers.findIndex((v) => v.id === voucher.id);
    if (existingIndex >= 0) {
      vouchers[existingIndex] = voucher;
    } else {
      vouchers.unshift(voucher);
    }
    safeSet(STORAGE_KEYS.VOUCHERS, vouchers);

    if (voucher.isPosted) {
      // 1. Post to Journal
      const je = createJournalForVoucher(voucher);
      const filteredJournals = journals.filter((j) => j.sourceId !== voucher.id);
      filteredJournals.push(je);
      safeSet(STORAGE_KEYS.JOURNALS, filteredJournals);

      // 2. If voucher is linked to a purchase invoice, update paidAmount
      if (voucher.voucherType === 'CPV' && voucher.allocatedInvoiceId) {
        const invIndex = purchases.findIndex((p) => p.id === voucher.allocatedInvoiceId);
        if (invIndex >= 0) {
          const inv = purchases[invIndex];
          const newPaid = inv.paidAmount + voucher.amount;
          const newBalance = Math.max(0, inv.netTotal - newPaid);
          purchases[invIndex] = {
            ...inv,
            paidAmount: newPaid,
            balanceAmount: newBalance,
            paymentStatus: newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID',
          };
          safeSet(STORAGE_KEYS.PURCHASES, purchases);
        }
      }
    }
  }

  async cancelVoucher(voucherId: string): Promise<void> {
    const vouchers = await this.getVouchers();
    const target = vouchers.find((v) => v.id === voucherId);
    if (!target) return;

    target.isPosted = false;
    safeSet(STORAGE_KEYS.VOUCHERS, vouchers);

    const journals = (await this.getJournalEntries()).filter((j) => j.sourceId !== voucherId);
    safeSet(STORAGE_KEYS.JOURNALS, journals);
  }

  // --- Sales ---
  async getSales(): Promise<SalesEntry[]> {
    return safeGet<SalesEntry[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
  }

  async saveSales(sale: SalesEntry): Promise<void> {
    const sales = await this.getSales();
    const journals = await this.getJournalEntries();

    const existingIndex = sales.findIndex((s) => s.id === sale.id);
    if (existingIndex >= 0) {
      sales[existingIndex] = sale;
    } else {
      sales.unshift(sale);
    }
    safeSet(STORAGE_KEYS.SALES, sales);

    if (sale.isPosted) {
      const je = createJournalForSales(sale);
      const filteredJournals = journals.filter((j) => j.sourceId !== sale.id);
      filteredJournals.push(je);
      safeSet(STORAGE_KEYS.JOURNALS, filteredJournals);
    }
  }

  // --- General Ledger & Journals ---
  async getJournalEntries(): Promise<JournalEntry[]> {
    return safeGet<JournalEntry[]>(STORAGE_KEYS.JOURNALS, INITIAL_JOURNAL_ENTRIES);
  }

  async saveJournalEntry(entry: JournalEntry): Promise<void> {
    const journals = await this.getJournalEntries();
    const index = journals.findIndex((j) => j.id === entry.id);
    if (index >= 0) {
      journals[index] = entry;
    } else {
      journals.push(entry);
    }
    safeSet(STORAGE_KEYS.JOURNALS, journals);
  }
}

export const localStorageAdapter = new LocalStorageAdapter();

