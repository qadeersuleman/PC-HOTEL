import { Item, ItemCategory, StockMovement } from '../types/inventory';
import { Department, IssueInvoice } from '../types/issue';
import { Vendor, Customer } from '../types/party';
import { PurchaseInvoice } from '../types/purchase';
import { Account, JournalEntry } from '../types/accounting';
import { Voucher } from '../types/voucher';
import { SalesEntry } from '../types/sales';

export const INITIAL_HOTEL_INFO = {
  name: 'GT Road Cafe Taj',
  tagline: 'Restaurant & Banquet Management ERP',
  address: 'National Highway N-5, GT Road, Rohri / Sukkur',
  phone: '+92 300 1234567',
  currency: 'PKR',
  financialYear: '2026-2027',
};

// Standard Categories (Clean structure, no fake numbers)
export const INITIAL_CATEGORIES: ItemCategory[] = [
  { id: 'cat-meat', code: 'CAT-01', name: 'Meat & Poultry Section', description: 'Fresh meats, mutton and chicken', defaultExpenseAccountId: 'acc-500100' },
  { id: 'cat-veg', code: 'CAT-02', name: 'Vegetables & Produce', description: 'Fresh culinary vegetables and ingredients', defaultExpenseAccountId: 'acc-500100' },
  { id: 'cat-bev', code: 'CAT-03', name: 'Bar & Beverages', description: 'Soft drinks, juices, mineral water', defaultExpenseAccountId: 'acc-500100' },
  { id: 'cat-store', code: 'CAT-04', name: 'General Store & Grains', description: 'Spices, oils, grains, and dry items', defaultExpenseAccountId: 'acc-500100' },
  { id: 'cat-dairy', code: 'CAT-05', name: 'Dairy Products', description: 'Milk, yogurt, cheese, butter, cream', defaultExpenseAccountId: 'acc-500100' },
  { id: 'cat-pack', code: 'CAT-06', name: 'Packaging & Disposables', description: 'Bags, takeaway boxes, and wrapping', defaultExpenseAccountId: 'acc-600300' },
];

// Standard Departments (Kitchen vs Operating stations)
export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-kitchen', code: 'DEP-01', name: 'Main Kitchen', isKitchen: true, expenseAccountId: 'acc-500100', isActive: true, description: 'Food preparation and cooking' },
  { id: 'dept-bbq', code: 'DEP-02', name: 'BBQ & Grill Counter', isKitchen: true, expenseAccountId: 'acc-500100', isActive: true, description: 'Live charcoal barbecue' },
  { id: 'dept-bar', code: 'DEP-03', name: 'Beverages & Chai Counter', isKitchen: true, expenseAccountId: 'acc-500100', isActive: true, description: 'Tea, juices, and drinks' },
  { id: 'dept-packing', code: 'DEP-04', name: 'Packing & Parcel Station', isKitchen: false, expenseAccountId: 'acc-600300', isActive: true, description: 'Takeaway packaging section' },
  { id: 'dept-housekeeping', code: 'DEP-05', name: 'Housekeeping & Cleaning', isKitchen: false, expenseAccountId: 'acc-600400', isActive: true, description: 'Sanitation and hygiene supplies' },
  { id: 'dept-store', code: 'DEP-06', name: 'Central Store', isKitchen: false, expenseAccountId: 'acc-100200', isActive: true, description: 'Raw material buffer store' },
];

// Completely clean empty items - user creates their own!
export const INITIAL_ITEMS: Item[] = [];

// Completely clean empty vendors - user creates their own!
export const INITIAL_VENDORS: Vendor[] = [];

// Completely clean empty customers - user creates their own!
export const INITIAL_CUSTOMERS: Customer[] = [];

// Standard Double-Entry Chart of Accounts
export const INITIAL_ACCOUNTS: Account[] = [
  // 100000 - ASSETS
  { id: 'acc-100100', code: '100100', name: 'Cash in Hand (Counter)', category: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', isSystem: true, isActive: true },
  { id: 'acc-100110', code: '100110', name: 'Meezan Bank Operating A/C', category: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', isSystem: true, isActive: true },
  { id: 'acc-100200', code: '100200', name: 'Inventory Asset (Store Stock)', category: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', isSystem: true, isActive: true },
  { id: 'acc-100500', code: '100500', name: 'Accounts Receivable (Customers)', category: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', isSystem: true, isActive: true },
  { id: 'acc-100700', code: '100700', name: 'Vendor Advances & Deposits', category: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', isSystem: true, isActive: true },
  
  // 200000 - LIABILITIES
  { id: 'acc-201900', code: '201900', name: 'Accounts Payable (Vendors)', category: 'LIABILITY', subCategory: 'Current Liabilities', normalBalance: 'CREDIT', isSystem: true, isActive: true },
  { id: 'acc-202000', code: '202000', name: 'Sales Tax Payable (SRB)', category: 'LIABILITY', subCategory: 'Current Liabilities', normalBalance: 'CREDIT', isSystem: false, isActive: true },
  
  // 300000 - EQUITY
  { id: 'acc-300100', code: '300100', name: "Owner's Capital", category: 'EQUITY', subCategory: 'Equity', normalBalance: 'CREDIT', isSystem: true, isActive: true },
  { id: 'acc-300200', code: '300200', name: 'Retained Earnings', category: 'EQUITY', subCategory: 'Equity', normalBalance: 'CREDIT', isSystem: true, isActive: true },
  
  // 400000 - REVENUE
  { id: 'acc-400100', code: '400100', name: 'Restaurant Sales Revenue', category: 'REVENUE', subCategory: 'Operating Revenue', normalBalance: 'CREDIT', isSystem: true, isActive: true },
  { id: 'acc-400200', code: '400200', name: 'Other Operating Income', category: 'REVENUE', subCategory: 'Other Income', normalBalance: 'CREDIT', isSystem: false, isActive: true },
  
  // 500000 - COST OF GOODS SOLD (COGS)
  { id: 'acc-500100', code: '500100', name: 'Cost of Goods Sold (Kitchen Consumption)', category: 'EXPENSE', subCategory: 'Direct Cost', normalBalance: 'DEBIT', isSystem: true, isActive: true },
  
  // 600000 - OPERATING EXPENSES
  { id: 'acc-600100', code: '600100', name: 'Salaries & Staff Wages', category: 'EXPENSE', subCategory: 'Operating Expense', normalBalance: 'DEBIT', isSystem: false, isActive: true },
  { id: 'acc-600200', code: '600200', name: 'Electricity & Gas Utilities', category: 'EXPENSE', subCategory: 'Operating Expense', normalBalance: 'DEBIT', isSystem: false, isActive: true },
  { id: 'acc-600300', code: '600300', name: 'Packaging & Disposables Expense', category: 'EXPENSE', subCategory: 'Operating Expense', normalBalance: 'DEBIT', isSystem: false, isActive: true },
  { id: 'acc-600400', code: '600400', name: 'Housekeeping & Sanitation Expense', category: 'EXPENSE', subCategory: 'Operating Expense', normalBalance: 'DEBIT', isSystem: false, isActive: true },
  { id: 'acc-600500', code: '600500', name: 'Building Rent Expense', category: 'EXPENSE', subCategory: 'Operating Expense', normalBalance: 'DEBIT', isSystem: false, isActive: true },
  { id: 'acc-600600', code: '600600', name: 'Printing & Stationery Expense', category: 'EXPENSE', subCategory: 'Operating Expense', normalBalance: 'DEBIT', isSystem: false, isActive: true },
  { id: 'acc-600900', code: '600900', name: 'Wastage & Spoilage Expense', category: 'EXPENSE', subCategory: 'Direct Cost', normalBalance: 'DEBIT', isSystem: false, isActive: true },
];

// ZERO DUMMY TRANSACTIONS
export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];
export const INITIAL_PURCHASES: PurchaseInvoice[] = [];
export const INITIAL_ISSUES: IssueInvoice[] = [];
export const INITIAL_VOUCHERS: Voucher[] = [];
export const INITIAL_SALES: SalesEntry[] = [];
export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [];
