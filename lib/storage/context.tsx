'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Item, ItemCategory, StockMovement, StockAdjustment, ItemStockStatus } from '../../types/inventory';
import { Department, IssueInvoice } from '../../types/issue';
import { Vendor, Customer } from '../../types/party';
import { PurchaseInvoice } from '../../types/purchase';
import { Account, JournalEntry } from '../../types/accounting';
import { Voucher } from '../../types/voucher';
import { SalesEntry } from '../../types/sales';
import { localStorageAdapter } from './local-storage';
import { supabaseStorageAdapter } from './supabase-adapter';
import { isSupabaseConfigured } from './supabase-client';
import { StorageAdapter } from './adapter';
import { calculateAllItemsStockStatus } from '../inventory/stock-movements';
import { calculateAllVendorBalances, calculateAllCustomerBalances, VendorBalanceSummary, CustomerBalanceSummary } from '../accounting/payable-receivable';
import { calculateAccountGeneralLedger } from '../accounting/ledger';
import { round2 } from '../utils/formatters';

interface ERPContextType {
  isLoaded: boolean;
  isUsingSupabase: boolean;
  // Master lists
  items: Item[];
  categories: ItemCategory[];
  departments: Department[];
  vendors: Vendor[];
  customers: Customer[];
  accounts: Account[];
  // Transactions
  purchases: PurchaseInvoice[];
  issues: IssueInvoice[];
  stockMovements: StockMovement[];
  stockAdjustments: StockAdjustment[];
  vouchers: Voucher[];
  sales: SalesEntry[];
  journalEntries: JournalEntry[];

  // Real-time computed analytics
  stockStatusList: ItemStockStatus[];
  totalStockValuation: number;
  lowStockItemsCount: number;

  vendorBalances: { summaries: VendorBalanceSummary[]; totalPayable: number; totalAdvances: number };
  customerBalances: { summaries: CustomerBalanceSummary[]; totalReceivable: number; totalAdvancesReceived: number };

  cashAndBankTotal: number;

  // Actions
  refreshData: () => Promise<void>;
  saveItem: (item: Item) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  saveCategory: (category: ItemCategory) => Promise<void>;
  saveDepartment: (dept: Department) => Promise<void>;
  saveVendor: (vendor: Vendor) => Promise<void>;
  saveCustomer: (customer: Customer) => Promise<void>;
  saveAccount: (account: Account) => Promise<void>;

  savePurchase: (invoice: PurchaseInvoice) => Promise<void>;
  cancelPurchase: (invoiceId: string) => Promise<void>;

  saveIssue: (issue: IssueInvoice) => Promise<void>;
  cancelIssue: (issueId: string) => Promise<void>;

  saveStockAdjustment: (adj: StockAdjustment) => Promise<void>;

  saveVoucher: (voucher: Voucher) => Promise<void>;
  cancelVoucher: (voucherId: string) => Promise<void>;

  saveSales: (sale: SalesEntry) => Promise<void>;

  resetToDemoData: () => Promise<void>;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export function ERPStorageProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [issues, setIssues] = useState<IssueInvoice[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [sales, setSales] = useState<SalesEntry[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  const activeAdapter: StorageAdapter = isSupabaseConfigured ? supabaseStorageAdapter : localStorageAdapter;

  const loadAll = useCallback(async () => {
    if (!isSupabaseConfigured) {
      localStorageAdapter.ensureInitialized();
    }
    try {
      const [i, c, d, v, cu, a, p, is, sm, sa, vo, s, j] = await Promise.all([
        activeAdapter.getItems(),
        activeAdapter.getCategories(),
        activeAdapter.getDepartments(),
        activeAdapter.getVendors(),
        activeAdapter.getCustomers(),
        activeAdapter.getAccounts(),
        activeAdapter.getPurchases(),
        activeAdapter.getIssues(),
        activeAdapter.getStockMovements(),
        activeAdapter.getStockAdjustments(),
        activeAdapter.getVouchers(),
        activeAdapter.getSales(),
        activeAdapter.getJournalEntries(),
      ]);

      setItems(i);
      setCategories(c);
      setDepartments(d);
      setVendors(v);
      setCustomers(cu);
      setAccounts(a);
      setPurchases(p);
      setIssues(is);
      setStockMovements(sm);
      setStockAdjustments(sa);
      setVouchers(vo);
      setSales(s);
      setJournalEntries(j);
    } catch (err) {
      console.error('Error loading ERP data via adapter:', err);
    } finally {
      setIsLoaded(true);
    }
  }, [activeAdapter]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Derived real-time calculations
  const stockStatusList = useMemo(() => {
    return calculateAllItemsStockStatus(items, categories, stockMovements);
  }, [items, categories, stockMovements]);

  const totalStockValuation = useMemo(() => {
    return round2(stockStatusList.reduce((sum, item) => sum + item.stockValue, 0));
  }, [stockStatusList]);

  const lowStockItemsCount = useMemo(() => {
    return stockStatusList.filter((i) => i.isLowStock).length;
  }, [stockStatusList]);

  const vendorBalances = useMemo(() => {
    return calculateAllVendorBalances(vendors, journalEntries);
  }, [vendors, journalEntries]);

  const customerBalances = useMemo(() => {
    return calculateAllCustomerBalances(customers, journalEntries);
  }, [customers, journalEntries]);

  const cashAndBankTotal = useMemo(() => {
    const cashAcc = accounts.find((a) => a.code === '100100');
    const bankAcc = accounts.find((a) => a.code === '100110');
    let total = 0;
    if (cashAcc) {
      const gl = calculateAccountGeneralLedger(cashAcc, journalEntries);
      total += gl.closingBalance;
    }
    if (bankAcc) {
      const gl = calculateAccountGeneralLedger(bankAcc, journalEntries);
      total += gl.closingBalance;
    }
    return round2(total);
  }, [accounts, journalEntries]);

  // Actions
  const refreshData = async () => {
    await loadAll();
  };

  const saveItem = async (item: Item) => {
    await activeAdapter.saveItem(item);
    await loadAll();
  };

  const deleteItem = async (id: string) => {
    await activeAdapter.deleteItem(id);
    await loadAll();
  };

  const saveCategory = async (cat: ItemCategory) => {
    await activeAdapter.saveCategory(cat);
    await loadAll();
  };

  const saveDepartment = async (dept: Department) => {
    await activeAdapter.saveDepartment(dept);
    await loadAll();
  };

  const saveVendor = async (ven: Vendor) => {
    await activeAdapter.saveVendor(ven);
    await loadAll();
  };

  const saveCustomer = async (cust: Customer) => {
    await activeAdapter.saveCustomer(cust);
    await loadAll();
  };

  const saveAccount = async (acc: Account) => {
    await activeAdapter.saveAccount(acc);
    await loadAll();
  };

  const savePurchase = async (inv: PurchaseInvoice) => {
    await activeAdapter.savePurchase(inv);
    await loadAll();
  };

  const cancelPurchase = async (id: string) => {
    await activeAdapter.cancelPurchase(id);
    await loadAll();
  };

  const saveIssue = async (iss: IssueInvoice) => {
    await activeAdapter.saveIssue(iss);
    await loadAll();
  };

  const cancelIssue = async (id: string) => {
    await activeAdapter.cancelIssue(id);
    await loadAll();
  };

  const saveStockAdjustment = async (adj: StockAdjustment) => {
    await activeAdapter.saveStockAdjustment(adj);
    await loadAll();
  };

  const saveVoucher = async (v: Voucher) => {
    await activeAdapter.saveVoucher(v);
    await loadAll();
  };

  const cancelVoucher = async (id: string) => {
    await activeAdapter.cancelVoucher(id);
    await loadAll();
  };

  const saveSales = async (sale: SalesEntry) => {
    await activeAdapter.saveSales(sale);
    await loadAll();
  };

  const resetToDemoData = async () => {
    await activeAdapter.resetToSeed();
    await loadAll();
  };

  const value = {
    isLoaded,
    isUsingSupabase: isSupabaseConfigured,
    items,
    categories,
    departments,
    vendors,
    customers,
    accounts,
    purchases,
    issues,
    stockMovements,
    stockAdjustments,
    vouchers,
    sales,
    journalEntries,
    stockStatusList,
    totalStockValuation,
    lowStockItemsCount,
    vendorBalances,
    customerBalances,
    cashAndBankTotal,
    refreshData,
    saveItem,
    deleteItem,
    saveCategory,
    saveDepartment,
    saveVendor,
    saveCustomer,
    saveAccount,
    savePurchase,
    cancelPurchase,
    saveIssue,
    cancelIssue,
    saveStockAdjustment,
    saveVoucher,
    cancelVoucher,
    saveSales,
    resetToDemoData,
  };

  return <ERPContext.Provider value={value}>{children}</ERPContext.Provider>;
}

export function useERPStorage(): ERPContextType {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERPStorage must be used within an ERPStorageProvider');
  }
  return context;
}

