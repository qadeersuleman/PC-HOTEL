import { StorageAdapter } from './adapter';
import { supabase } from './supabase-client';
import { SupabaseClient } from '@supabase/supabase-js';
import { Item, ItemCategory, StockMovement, StockAdjustment } from '../../types/inventory';
import { Department, IssueInvoice } from '../../types/issue';
import { Vendor, Customer } from '../../types/party';
import { PurchaseInvoice } from '../../types/purchase';
import { Account, JournalEntry } from '../../types/accounting';
import { Voucher } from '../../types/voucher';
import { SalesEntry } from '../../types/sales';
import { calculateWeightedAverageCost } from '../inventory/valuation';
import {
  createJournalForPurchase,
  createJournalForIssue,
  createJournalForSales,
  createJournalForVoucher,
  createJournalForAdjustment,
} from '../accounting/posting';

export class SupabaseStorageAdapter implements StorageAdapter {
  private get client(): SupabaseClient {
    if (!supabase) {
      throw new Error('Supabase client is not configured.');
    }
    return supabase;
  }

  async resetToSeed(): Promise<void> {
    if (!supabase) return;
    try {
      await this.client.from('journal_entries').delete().neq('id', 'NONE');
      await this.client.from('stock_movements').delete().neq('id', 'NONE');
      await this.client.from('stock_adjustments').delete().neq('id', 'NONE');
      await this.client.from('vouchers').delete().neq('id', 'NONE');
      await this.client.from('sales_entries').delete().neq('id', 'NONE');
      await this.client.from('purchase_invoices').delete().neq('id', 'NONE');
      await this.client.from('issue_invoices').delete().neq('id', 'NONE');
    } catch (err) {
      console.error('Error clearing Supabase transactions:', err);
    }
  }

  // --- Items ---
  async getItems(): Promise<Item[]> {
    const { data, error } = await this.client
      .from('items')
      .select('*')
      .order('code', { ascending: true });
    if (error) {
      console.error('Error fetching items from Supabase:', error);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      categoryId: row.category_id,
      unit: row.unit,
      minStockLevel: Number(row.min_stock_level) || 0,
      costPrice: Number(row.cost_price) || 0,
      sellingPrice: row.selling_price ? Number(row.selling_price) : undefined,
      isActive: row.is_active,
      notes: row.notes,
    }));
  }

  async saveItem(item: Item): Promise<void> {
    const { error } = await this.client.from('items').upsert({
      id: item.id,
      code: item.code,
      name: item.name,
      category_id: item.categoryId,
      unit: item.unit,
      min_stock_level: item.minStockLevel,
      cost_price: item.costPrice,
      selling_price: item.sellingPrice,
      is_active: item.isActive,
      notes: item.notes,
    });
    if (error) console.error('Error saving item in Supabase:', error);
  }

  async deleteItem(id: string): Promise<void> {
    const { error } = await this.client.from('items').delete().eq('id', id);
    if (error) console.error('Error deleting item from Supabase:', error);
  }

  // --- Categories ---
  async getCategories(): Promise<ItemCategory[]> {
    const { data, error } = await this.client.from('categories').select('*').order('name', { ascending: true });
    if (error) {
      console.error('Error fetching categories from Supabase:', error);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      defaultExpenseAccountId: row.default_expense_account_id,
    }));
  }

  async saveCategory(category: ItemCategory): Promise<void> {
    const { error } = await this.client.from('categories').upsert({
      id: category.id,
      code: category.code,
      name: category.name,
      description: category.description,
      default_expense_account_id: category.defaultExpenseAccountId,
    });
    if (error) console.error('Error saving category in Supabase:', error);
  }

  // --- Departments ---
  async getDepartments(): Promise<Department[]> {
    const { data, error } = await this.client.from('departments').select('*').order('code', { ascending: true });
    if (error) {
      console.error('Error fetching departments from Supabase:', error);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      isKitchen: row.is_kitchen,
      expenseAccountId: row.expense_account_id || 'acc-500100',
      description: row.description,
      isActive: row.is_active,
    }));
  }

  async saveDepartment(dept: Department): Promise<void> {
    const { error } = await this.client.from('departments').upsert({
      id: dept.id,
      code: dept.code,
      name: dept.name,
      is_kitchen: dept.isKitchen,
      expense_account_id: dept.expenseAccountId,
      description: dept.description,
      is_active: dept.isActive,
    });
    if (error) console.error('Error saving department in Supabase:', error);
  }

  // --- Vendors ---
  async getVendors(): Promise<Vendor[]> {
    const { data, error } = await this.client.from('vendors').select('*').order('account_no', { ascending: true });
    if (error) {
      console.error('Error fetching vendors from Supabase:', error);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      accountNo: row.account_no,
      name: row.name,
      category: row.category,
      phone: row.phone,
      address: row.address,
      openingBalance: Number(row.opening_balance) || 0,
      openingBalanceType: row.opening_balance_type,
      termsDays: row.terms_days || 15,
      isActive: row.is_active,
    }));
  }

  async saveVendor(vendor: Vendor): Promise<void> {
    const { error } = await this.client.from('vendors').upsert({
      id: vendor.id,
      account_no: vendor.accountNo,
      name: vendor.name,
      category: vendor.category,
      phone: vendor.phone,
      address: vendor.address,
      opening_balance: vendor.openingBalance,
      opening_balance_type: vendor.openingBalanceType,
      terms_days: vendor.termsDays,
      is_active: vendor.isActive,
    });
    if (error) console.error('Error saving vendor in Supabase:', error);
  }

  // --- Customers ---
  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await this.client.from('customers').select('*').order('account_no', { ascending: true });
    if (error) {
      console.error('Error fetching customers from Supabase:', error);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      accountNo: row.account_no,
      name: row.name,
      category: row.category,
      phone: row.phone,
      address: row.address,
      openingBalance: Number(row.opening_balance) || 0,
      openingBalanceType: row.opening_balance_type,
      creditLimit: Number(row.credit_limit) || 50000,
      isActive: row.is_active,
    }));
  }

  async saveCustomer(customer: Customer): Promise<void> {
    const { error } = await this.client.from('customers').upsert({
      id: customer.id,
      account_no: customer.accountNo,
      name: customer.name,
      category: customer.category,
      phone: customer.phone,
      address: customer.address,
      opening_balance: customer.openingBalance,
      opening_balance_type: customer.openingBalanceType,
      credit_limit: customer.creditLimit,
      is_active: customer.isActive,
    });
    if (error) console.error('Error saving customer in Supabase:', error);
  }

  // --- Accounts ---
  async getAccounts(): Promise<Account[]> {
    const { data, error } = await this.client.from('accounts').select('*').order('code', { ascending: true });
    if (error) {
      console.error('Error fetching accounts from Supabase:', error);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      category: row.category,
      subCategory: row.sub_category,
      normalBalance: row.normal_balance,
      description: row.description,
      isSystem: row.is_system,
      isActive: row.is_active,
    }));
  }

  async saveAccount(account: Account): Promise<void> {
    const { error } = await this.client.from('accounts').upsert({
      id: account.id,
      code: account.code,
      name: account.name,
      category: account.category,
      sub_category: account.subCategory,
      normal_balance: account.normalBalance,
      description: account.description,
      is_system: account.isSystem,
      is_active: account.isActive,
    });
    if (error) console.error('Error saving account in Supabase:', error);
  }

  // --- Purchases & Automated Stock Movement & GL Posting ---
  async getPurchases(): Promise<PurchaseInvoice[]> {
    const { data, error } = await this.client
      .from('purchase_invoices')
      .select('*')
      .order('date', { ascending: false });
    if (error) {
      console.error('Error fetching purchases from Supabase:', error);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      date: row.date,
      vendorId: row.vendor_id,
      vendorName: row.vendor_name,
      paymentType: row.payment_type,
      paymentTermsDays: row.payment_terms_days,
      dueDate: row.due_date,
      items: row.items || [],
      subtotal: Number(row.subtotal) || 0,
      totalDiscount: Number(row.total_discount) || 0,
      totalTax: Number(row.total_tax) || 0,
      netTotal: Number(row.net_total) || 0,
      paidAmount: Number(row.paid_amount) || 0,
      balanceAmount: Number(row.balance_amount) || 0,
      paymentStatus: row.payment_status,
      notes: row.notes,
      isPosted: row.is_posted,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async savePurchase(invoice: PurchaseInvoice): Promise<void> {
    await this.client.from('purchase_invoices').upsert({
      id: invoice.id,
      invoice_number: invoice.invoiceNumber,
      date: invoice.date,
      vendor_id: invoice.vendorId,
      vendor_name: invoice.vendorName,
      payment_type: invoice.paymentType,
      payment_terms_days: invoice.paymentTermsDays,
      due_date: invoice.dueDate,
      items: invoice.items,
      subtotal: invoice.subtotal,
      total_discount: invoice.totalDiscount,
      total_tax: invoice.totalTax,
      net_total: invoice.netTotal,
      paid_amount: invoice.paidAmount,
      balance_amount: invoice.balanceAmount,
      payment_status: invoice.paymentStatus,
      notes: invoice.notes,
      is_posted: invoice.isPosted,
    });

    if (invoice.isPosted) {
      // 1. Delete previous stock movements for this invoice
      await this.client.from('stock_movements').delete().eq('reference_id', invoice.id);

      // 2. Insert new stock movements
      const movementsToInsert = invoice.items.map((line) => ({
        id: `sm-pi-${invoice.id}-${line.itemId}`,
        item_id: line.itemId,
        movement_type: 'PURCHASE',
        quantity: line.quantity,
        unit_cost: line.unitPrice,
        total_cost: line.lineTotal,
        reference_type: 'PURCHASE_INVOICE',
        reference_id: invoice.id,
        reference_number: invoice.invoiceNumber,
        date: invoice.date,
        notes: `Purchased from ${invoice.vendorName}`,
      }));

      await this.client.from('stock_movements').insert(movementsToInsert);

      // 3. Update Item WAC
      const items = await this.getItems();
      for (const line of invoice.items) {
        const item = items.find((i) => i.id === line.itemId);
        if (item) {
          const newAvgCost = calculateWeightedAverageCost(0, item.costPrice, line.quantity, line.unitPrice);
          await this.client.from('items').update({ cost_price: newAvgCost }).eq('id', line.itemId);
        }
      }

      // 4. Post Journal Entry
      const je = createJournalForPurchase(invoice);
      await this.client.from('journal_entries').delete().eq('source_id', invoice.id);
      await this.client.from('journal_entries').insert({
        id: je.id,
        entry_number: je.entryNumber,
        date: je.date,
        source_type: je.sourceType,
        source_id: je.sourceId,
        source_number: je.sourceNumber,
        description: je.description,
        lines: je.lines,
        total_amount: je.totalAmount,
      });
    }
  }

  async cancelPurchase(invoiceId: string): Promise<void> {
    await this.client
      .from('purchase_invoices')
      .update({ payment_status: 'CANCELLED', is_posted: false })
      .eq('id', invoiceId);
    await this.client.from('stock_movements').delete().eq('reference_id', invoiceId);
    await this.client.from('journal_entries').delete().eq('source_id', invoiceId);
  }

  // --- Issues ---
  async getIssues(): Promise<IssueInvoice[]> {
    const { data, error } = await this.client
      .from('issue_invoices')
      .select('*')
      .order('date', { ascending: false });
    if (error) {
      console.error('Error fetching issues from Supabase:', error);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      issueNumber: row.issue_number,
      date: row.date,
      departmentId: row.department_id,
      departmentName: row.department_name,
      items: row.items || [],
      totalCost: Number(row.total_cost) || 0,
      destination: row.destination,
      notes: row.notes,
      isPosted: row.is_posted,
      createdAt: row.created_at,
    }));
  }

  async saveIssue(issue: IssueInvoice): Promise<void> {
    await this.client.from('issue_invoices').upsert({
      id: issue.id,
      issue_number: issue.issueNumber,
      date: issue.date,
      department_id: issue.departmentId,
      department_name: issue.departmentName,
      items: issue.items,
      total_cost: issue.totalCost,
      destination: issue.destination,
      notes: issue.notes,
      is_posted: issue.isPosted,
    });

    if (issue.isPosted) {
      await this.client.from('stock_movements').delete().eq('reference_id', issue.id);

      const movementsToInsert = issue.items.map((line) => ({
        id: `sm-iss-${issue.id}-${line.itemId}`,
        item_id: line.itemId,
        movement_type: 'ISSUE',
        quantity: line.issueQuantity,
        unit_cost: line.unitCost,
        total_cost: line.totalCost,
        reference_type: 'ISSUE_INVOICE',
        reference_id: issue.id,
        reference_number: issue.issueNumber,
        date: issue.date,
        department_id: issue.departmentId,
        notes: `Issued to ${issue.departmentName}`,
      }));

      await this.client.from('stock_movements').insert(movementsToInsert);

      const depts = await this.getDepartments();
      const dept = depts.find((d) => d.id === issue.departmentId);
      const je = createJournalForIssue(issue, dept);

      await this.client.from('journal_entries').delete().eq('source_id', issue.id);
      await this.client.from('journal_entries').insert({
        id: je.id,
        entry_number: je.entryNumber,
        date: je.date,
        source_type: je.sourceType,
        source_id: je.sourceId,
        source_number: je.sourceNumber,
        description: je.description,
        lines: je.lines,
        total_amount: je.totalAmount,
      });
    }
  }

  async cancelIssue(issueId: string): Promise<void> {
    await this.client.from('issue_invoices').update({ is_posted: false }).eq('id', issueId);
    await this.client.from('stock_movements').delete().eq('reference_id', issueId);
    await this.client.from('journal_entries').delete().eq('source_id', issueId);
  }

  // --- Stock Movements ---
  async getStockMovements(): Promise<StockMovement[]> {
    const { data, error } = await this.client
      .from('stock_movements')
      .select('*')
      .order('date', { ascending: true });
    if (error) {
      console.error('Error fetching stock movements from Supabase:', error);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      itemId: row.item_id,
      movementType: row.movement_type,
      quantity: Number(row.quantity) || 0,
      unitCost: Number(row.unit_cost) || 0,
      totalCost: Number(row.total_cost) || 0,
      referenceType: row.reference_type,
      referenceId: row.reference_id,
      referenceNumber: row.reference_number,
      date: row.date,
      departmentId: row.department_id,
      notes: row.notes,
      createdAt: row.created_at,
    }));
  }

  async saveStockMovement(movement: StockMovement): Promise<void> {
    await this.client.from('stock_movements').upsert({
      id: movement.id,
      item_id: movement.itemId,
      movement_type: movement.movementType,
      quantity: movement.quantity,
      unit_cost: movement.unitCost,
      total_cost: movement.totalCost,
      reference_type: movement.referenceType,
      reference_id: movement.referenceId,
      reference_number: movement.referenceNumber,
      date: movement.date,
      department_id: movement.departmentId,
      notes: movement.notes,
    });
  }

  // --- Adjustments ---
  async getStockAdjustments(): Promise<StockAdjustment[]> {
    const { data, error } = await this.client
      .from('stock_adjustments')
      .select('*')
      .order('date', { ascending: false });
    if (error) {
      console.error('Error fetching stock adjustments from Supabase:', error);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      adjustmentNumber: row.adjustment_number,
      date: row.date,
      itemId: row.item_id,
      type: row.type,
      quantity: Number(row.quantity) || 0,
      unitCost: Number(row.unit_cost) || 0,
      totalAmount: Number(row.total_amount) || 0,
      reason: row.reason,
      notes: row.notes,
      isPosted: row.is_posted,
      createdAt: row.created_at,
    }));
  }

  async saveStockAdjustment(adj: StockAdjustment): Promise<void> {
    await this.client.from('stock_adjustments').upsert({
      id: adj.id,
      adjustment_number: adj.adjustmentNumber,
      date: adj.date,
      item_id: adj.itemId,
      type: adj.type,
      quantity: adj.quantity,
      unit_cost: adj.unitCost,
      total_amount: adj.totalAmount,
      reason: adj.reason,
      notes: adj.notes,
      is_posted: adj.isPosted,
    });

    if (adj.isPosted) {
      const isPositive = adj.quantity > 0;
      await this.client.from('stock_movements').insert({
        id: `sm-adj-${adj.id}`,
        item_id: adj.itemId,
        movement_type: isPositive ? 'ADJUSTMENT_ADD' : adj.type === 'WASTAGE' ? 'WASTAGE' : 'ADJUSTMENT_DEDUCT',
        quantity: Math.abs(adj.quantity),
        unit_cost: adj.unitCost,
        total_cost: Math.abs(adj.totalAmount),
        reference_type: 'STOCK_ADJUSTMENT',
        reference_id: adj.id,
        reference_number: adj.adjustmentNumber,
        date: adj.date,
        notes: `${adj.type}: ${adj.reason}`,
      });

      const je = createJournalForAdjustment(adj);
      await this.client.from('journal_entries').insert({
        id: je.id,
        entry_number: je.entryNumber,
        date: je.date,
        source_type: je.sourceType,
        source_id: je.sourceId,
        source_number: je.sourceNumber,
        description: je.description,
        lines: je.lines,
        total_amount: je.totalAmount,
      });
    }
  }

  // --- Vouchers ---
  async getVouchers(): Promise<Voucher[]> {
    const { data, error } = await this.client
      .from('vouchers')
      .select('*')
      .order('date', { ascending: false });
    if (error) {
      console.error('Error fetching vouchers from Supabase:', error);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      voucherNumber: row.voucher_number,
      voucherType: row.voucher_type,
      date: row.date,
      description: row.description,
      referenceNo: row.reference_no,
      amount: Number(row.amount) || 0,
      partyId: row.party_id,
      partyType: row.party_type,
      paymentMethod: row.payment_method,
      bankAccountId: row.bank_account_id,
      allocatedInvoiceId: row.allocated_invoice_id,
      lines: row.lines || [],
      isPosted: row.is_posted,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async saveVoucher(voucher: Voucher): Promise<void> {
    await this.client.from('vouchers').upsert({
      id: voucher.id,
      voucher_number: voucher.voucherNumber,
      voucher_type: voucher.voucherType,
      date: voucher.date,
      description: voucher.description,
      reference_no: voucher.referenceNo,
      amount: voucher.amount,
      party_id: voucher.partyId,
      party_type: voucher.partyType,
      payment_method: voucher.paymentMethod,
      bank_account_id: voucher.bankAccountId,
      allocated_invoice_id: voucher.allocatedInvoiceId,
      lines: voucher.lines,
      is_posted: voucher.isPosted,
    });

    if (voucher.isPosted) {
      const je = createJournalForVoucher(voucher);
      await this.client.from('journal_entries').delete().eq('source_id', voucher.id);
      await this.client.from('journal_entries').insert({
        id: je.id,
        entry_number: je.entryNumber,
        date: je.date,
        source_type: je.sourceType,
        source_id: je.sourceId,
        source_number: je.sourceNumber,
        description: je.description,
        lines: je.lines,
        total_amount: je.totalAmount,
      });

      if (voucher.voucherType === 'CPV' && voucher.allocatedInvoiceId) {
        const { data: inv } = await this.client
          .from('purchase_invoices')
          .select('*')
          .eq('id', voucher.allocatedInvoiceId)
          .single();
        if (inv) {
          const newPaid = Number(inv.paid_amount || 0) + voucher.amount;
          const newBal = Math.max(0, Number(inv.net_total || 0) - newPaid);
          await this.client
            .from('purchase_invoices')
            .update({
              paid_amount: newPaid,
              balance_amount: newBal,
              payment_status: newBal === 0 ? 'PAID' : 'PARTIALLY_PAID',
            })
            .eq('id', voucher.allocatedInvoiceId);
        }
      }
    }
  }

  async cancelVoucher(voucherId: string): Promise<void> {
    await this.client.from('vouchers').update({ is_posted: false }).eq('id', voucherId);
    await this.client.from('journal_entries').delete().eq('source_id', voucherId);
  }

  // --- Sales ---
  async getSales(): Promise<SalesEntry[]> {
    const { data, error } = await this.client
      .from('sales_entries')
      .select('*')
      .order('date', { ascending: false });
    if (error) {
      console.error('Error fetching sales from Supabase:', error);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      date: row.date,
      channel: row.channel,
      grossSales: Number(row.gross_sales) || 0,
      discount: Number(row.discount) || 0,
      netSales: Number(row.net_sales) || 0,
      tax: Number(row.tax) || 0,
      totalReceivable: Number(row.total_receivable) || 0,
      paymentMethod: row.payment_method,
      customerId: row.customer_id,
      customerName: row.customer_name,
      cashAmount: Number(row.cash_amount) || 0,
      bankAmount: Number(row.bank_amount) || 0,
      creditAmount: Number(row.credit_amount) || 0,
      notes: row.notes,
      isPosted: row.is_posted,
      createdAt: row.created_at,
    }));
  }

  async saveSales(sale: SalesEntry): Promise<void> {
    await this.client.from('sales_entries').upsert({
      id: sale.id,
      invoice_number: sale.invoiceNumber,
      date: sale.date,
      channel: sale.channel,
      gross_sales: sale.grossSales,
      discount: sale.discount,
      net_sales: sale.netSales,
      tax: sale.tax,
      total_receivable: sale.totalReceivable,
      payment_method: sale.paymentMethod,
      customer_id: sale.customerId,
      customer_name: sale.customerName,
      cash_amount: sale.cashAmount,
      bank_amount: sale.bankAmount,
      credit_amount: sale.creditAmount,
      notes: sale.notes,
      is_posted: sale.isPosted,
    });

    if (sale.isPosted) {
      const je = createJournalForSales(sale);
      await this.client.from('journal_entries').delete().eq('source_id', sale.id);
      await this.client.from('journal_entries').insert({
        id: je.id,
        entry_number: je.entryNumber,
        date: je.date,
        source_type: je.sourceType,
        source_id: je.sourceId,
        source_number: je.sourceNumber,
        description: je.description,
        lines: je.lines,
        total_amount: je.totalAmount,
      });
    }
  }

  // --- Journals ---
  async getJournalEntries(): Promise<JournalEntry[]> {
    const { data, error } = await this.client
      .from('journal_entries')
      .select('*')
      .order('date', { ascending: true });
    if (error) {
      console.error('Error fetching journal entries from Supabase:', error);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      entryNumber: row.entry_number,
      date: row.date,
      sourceType: row.source_type,
      sourceId: row.source_id,
      sourceNumber: row.source_number,
      description: row.description,
      lines: row.lines || [],
      totalAmount: Number(row.total_amount) || 0,
      isReversed: row.is_reversed,
      createdAt: row.created_at,
    }));
  }

  async saveJournalEntry(entry: JournalEntry): Promise<void> {
    if (!supabase) return;
    await this.client.from('journal_entries').upsert({
      id: entry.id,
      entry_number: entry.entryNumber,
      date: entry.date,
      source_type: entry.sourceType,
      source_id: entry.sourceId,
      source_number: entry.sourceNumber,
      description: entry.description,
      lines: entry.lines,
      total_amount: entry.totalAmount,
      is_reversed: entry.isReversed,
    });
  }
}

export const supabaseStorageAdapter = new SupabaseStorageAdapter();

