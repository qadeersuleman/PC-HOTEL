-- ==============================================================================
-- RESTAURANT ERP DATABASE SCHEMA FOR SUPABASE
-- Project: GT Road Cafe Taj / Restaurant Inventory & Accounting ERP
-- Run this complete script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Click "RUN"
-- ==============================================================================

-- 1. CLEANUP (DROP IF EXISTS TO PREVENT CONFLICTS)
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS sales_entries CASCADE;
DROP TABLE IF EXISTS vouchers CASCADE;
DROP TABLE IF EXISTS stock_adjustments CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS issue_invoices CASCADE;
DROP TABLE IF EXISTS purchase_invoices CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;

-- 2. CHART OF ACCOUNTS (COA)
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
  sub_category TEXT,
  normal_balance TEXT NOT NULL CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ITEM CATEGORIES
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  default_expense_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DEPARTMENTS (KITCHEN VS OPERATING STATIONS)
CREATE TABLE departments (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  is_kitchen BOOLEAN DEFAULT TRUE,
  expense_account_id TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INVENTORY ITEMS (PRODUCTS & RAW MATERIALS)
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  unit TEXT NOT NULL,
  min_stock_level NUMERIC DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  selling_price NUMERIC,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. VENDORS (SUPPLIERS & CREDITORS)
CREATE TABLE vendors (
  id TEXT PRIMARY KEY,
  account_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  phone TEXT,
  address TEXT,
  opening_balance NUMERIC DEFAULT 0,
  opening_balance_type TEXT DEFAULT 'CREDIT' CHECK (opening_balance_type IN ('CREDIT', 'DEBIT')),
  terms_days INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CUSTOMERS (GUESTS & CORPORATE ACCOUNTS)
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  account_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'RESTAURANT_GUEST' CHECK (category IN ('RESTAURANT_GUEST', 'CORPORATE', 'EMPLOYEE', 'MISC')),
  phone TEXT,
  address TEXT,
  opening_balance NUMERIC DEFAULT 0,
  opening_balance_type TEXT DEFAULT 'DEBIT' CHECK (opening_balance_type IN ('DEBIT', 'CREDIT')),
  credit_limit NUMERIC DEFAULT 50000,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PURCHASE INVOICES
CREATE TABLE purchase_invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  vendor_id TEXT REFERENCES vendors(id) ON DELETE RESTRICT,
  vendor_name TEXT NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('CASH', 'CREDIT', 'BANK')),
  payment_terms_days INTEGER DEFAULT 0,
  due_date DATE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  subtotal NUMERIC DEFAULT 0,
  total_discount NUMERIC DEFAULT 0,
  total_tax NUMERIC DEFAULT 0,
  net_total NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  balance_amount NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'UNPAID' CHECK (payment_status IN ('PAID', 'PARTIALLY_PAID', 'UNPAID', 'CANCELLED')),
  notes TEXT,
  is_posted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ISSUE INVOICES (DEPARTMENTAL ISSUES)
CREATE TABLE issue_invoices (
  id TEXT PRIMARY KEY,
  issue_number TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  department_id TEXT REFERENCES departments(id) ON DELETE RESTRICT,
  department_name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  total_cost NUMERIC DEFAULT 0,
  destination TEXT,
  notes TEXT,
  is_posted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. STOCK MOVEMENTS (STOCK LEDGER AUDIT TRAIL)
CREATE TABLE stock_movements (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('PURCHASE', 'ISSUE', 'ADJUSTMENT_ADD', 'ADJUSTMENT_DEDUCT', 'WASTAGE', 'RETURN_TO_VENDOR', 'RETURN_FROM_DEPT')),
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('PURCHASE_INVOICE', 'ISSUE_INVOICE', 'STOCK_ADJUSTMENT', 'OPENING')),
  reference_id TEXT NOT NULL,
  reference_number TEXT NOT NULL,
  date DATE NOT NULL,
  department_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. STOCK ADJUSTMENTS & WASTAGE
CREATE TABLE stock_adjustments (
  id TEXT PRIMARY KEY,
  adjustment_number TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  item_id TEXT REFERENCES items(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  is_posted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. VOUCHERS (CRV, CPV, JV)
CREATE TABLE vouchers (
  id TEXT PRIMARY KEY,
  voucher_number TEXT UNIQUE NOT NULL,
  voucher_type TEXT NOT NULL CHECK (voucher_type IN ('CRV', 'CPV', 'JV')),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  reference_no TEXT,
  amount NUMERIC NOT NULL,
  party_id TEXT,
  party_type TEXT CHECK (party_type IN ('VENDOR', 'CUSTOMER', NULL)),
  payment_method TEXT,
  bank_account_id TEXT,
  allocated_invoice_id TEXT,
  lines JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_posted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. DAILY SALES ENTRIES
CREATE TABLE sales_entries (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('DINE_IN', 'TAKEAWAY', 'DELIVERY', 'CATERING')),
  gross_sales NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  net_sales NUMERIC NOT NULL,
  tax NUMERIC DEFAULT 0,
  total_receivable NUMERIC NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'ONLINE', 'CREDIT')),
  customer_id TEXT,
  customer_name TEXT,
  cash_amount NUMERIC DEFAULT 0,
  bank_amount NUMERIC DEFAULT 0,
  credit_amount NUMERIC DEFAULT 0,
  notes TEXT,
  is_posted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. GENERAL LEDGER JOURNAL ENTRIES (DOUBLE-ENTRY AUDIT)
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  entry_number TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('PURCHASE', 'ISSUE', 'VOUCHER', 'SALES', 'ADJUSTMENT', 'OPENING')),
  source_id TEXT NOT NULL,
  source_number TEXT NOT NULL,
  description TEXT NOT NULL,
  lines JSONB NOT NULL DEFAULT '[]'::JSONB,
  total_amount NUMERIC NOT NULL,
  is_reversed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 15. EXPLICIT ROW LEVEL SECURITY (RLS) & OPEN ACCESS POLICIES
-- ==============================================================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access accounts" ON accounts;
CREATE POLICY "Public Full Access accounts" ON accounts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access categories" ON categories;
CREATE POLICY "Public Full Access categories" ON categories FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access departments" ON departments;
CREATE POLICY "Public Full Access departments" ON departments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access items" ON items;
CREATE POLICY "Public Full Access items" ON items FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access vendors" ON vendors;
CREATE POLICY "Public Full Access vendors" ON vendors FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access customers" ON customers;
CREATE POLICY "Public Full Access customers" ON customers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access purchase_invoices" ON purchase_invoices;
CREATE POLICY "Public Full Access purchase_invoices" ON purchase_invoices FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE issue_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access issue_invoices" ON issue_invoices;
CREATE POLICY "Public Full Access issue_invoices" ON issue_invoices FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access stock_movements" ON stock_movements;
CREATE POLICY "Public Full Access stock_movements" ON stock_movements FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access stock_adjustments" ON stock_adjustments;
CREATE POLICY "Public Full Access stock_adjustments" ON stock_adjustments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access vouchers" ON vouchers;
CREATE POLICY "Public Full Access vouchers" ON vouchers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE sales_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access sales_entries" ON sales_entries;
CREATE POLICY "Public Full Access sales_entries" ON sales_entries FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access journal_entries" ON journal_entries;
CREATE POLICY "Public Full Access journal_entries" ON journal_entries FOR ALL USING (true) WITH CHECK (true);


-- ==============================================================================
-- 16. ESSENTIAL SYSTEM SEEDING: STANDARD CHART OF ACCOUNTS & DEPARTMENTS ONLY
-- (No dummy purchases, no fake invoices, no dummy transactions!)
-- ==============================================================================

-- Base System Accounts
INSERT INTO accounts (id, code, name, category, sub_category, normal_balance, is_system, is_active) VALUES
('acc-100100', '100100', 'Cash in Hand (Counter)', 'ASSET', 'Current Assets', 'DEBIT', TRUE, TRUE),
('acc-100110', '100110', 'Meezan Bank Operating A/C', 'ASSET', 'Current Assets', 'DEBIT', TRUE, TRUE),
('acc-100200', '100200', 'Inventory Asset (Store Stock)', 'ASSET', 'Current Assets', 'DEBIT', TRUE, TRUE),
('acc-100500', '100500', 'Accounts Receivable (Customers)', 'ASSET', 'Current Assets', 'DEBIT', TRUE, TRUE),
('acc-100700', '100700', 'Vendor Advances & Deposits', 'ASSET', 'Current Assets', 'DEBIT', TRUE, TRUE),
('acc-201900', '201900', 'Accounts Payable (Vendors)', 'LIABILITY', 'Current Liabilities', 'CREDIT', TRUE, TRUE),
('acc-202000', '202000', 'Sales Tax Payable (SRB)', 'LIABILITY', 'Current Liabilities', 'CREDIT', FALSE, TRUE),
('acc-300100', '300100', 'Owner''s Capital', 'EQUITY', 'Equity', 'CREDIT', TRUE, TRUE),
('acc-300200', '300200', 'Retained Earnings', 'EQUITY', 'Equity', 'CREDIT', TRUE, TRUE),
('acc-400100', '400100', 'Restaurant Sales Revenue', 'REVENUE', 'Operating Revenue', 'CREDIT', TRUE, TRUE),
('acc-400200', '400200', 'Other Operating Income', 'REVENUE', 'Other Income', 'CREDIT', FALSE, TRUE),
('acc-500100', '500100', 'Cost of Goods Sold (Kitchen Consumption)', 'EXPENSE', 'Direct Cost', 'DEBIT', TRUE, TRUE),
('acc-600100', '600100', 'Salaries & Staff Wages', 'EXPENSE', 'Operating Expense', 'DEBIT', FALSE, TRUE),
('acc-600200', '600200', 'Electricity & Gas Utilities', 'EXPENSE', 'Operating Expense', 'DEBIT', FALSE, TRUE),
('acc-600300', '600300', 'Packaging & Disposables Expense', 'EXPENSE', 'Operating Expense', 'DEBIT', FALSE, TRUE),
('acc-600400', '600400', 'Housekeeping & Sanitation Expense', 'EXPENSE', 'Operating Expense', 'DEBIT', FALSE, TRUE),
('acc-600500', '600500', 'Building Rent Expense', 'EXPENSE', 'Operating Expense', 'DEBIT', FALSE, TRUE),
('acc-600600', '600600', 'Printing & Stationery Expense', 'EXPENSE', 'Operating Expense', 'DEBIT', FALSE, TRUE),
('acc-600900', '600900', 'Wastage & Spoilage Expense', 'EXPENSE', 'Direct Cost', 'DEBIT', FALSE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Standard Restaurant Categories
INSERT INTO categories (id, code, name, description, default_expense_account_id) VALUES
('cat-meat', 'CAT-01', 'Meat & Poultry Section', 'Fresh meats, mutton and chicken', 'acc-500100'),
('cat-veg', 'CAT-02', 'Vegetables & Produce', 'Fresh culinary vegetables and ingredients', 'acc-500100'),
('cat-bev', 'CAT-03', 'Bar & Beverages', 'Cold drinks, juices, mineral water', 'acc-500100'),
('cat-store', 'CAT-04', 'General Store & Grains', 'Spices, oils, grains, and dry items', 'acc-500100'),
('cat-dairy', 'CAT-05', 'Dairy Products', 'Milk, yogurt, cream, butter, cheese', 'acc-500100'),
('cat-pack', 'CAT-06', 'Packaging & Disposables', 'Bags, takeaway boxes, and wrapping', 'acc-600300')
ON CONFLICT (id) DO NOTHING;

-- Standard Restaurant Departments
INSERT INTO departments (id, code, name, is_kitchen, expense_account_id, description, is_active) VALUES
('dept-kitchen', 'DEP-01', 'Main Kitchen', TRUE, 'acc-500100', 'Main food cooking and preparation', TRUE),
('dept-bbq', 'DEP-02', 'BBQ & Grill Counter', TRUE, 'acc-500100', 'Live charcoal BBQ station', TRUE),
('dept-bar', 'DEP-03', 'Beverages & Chai Counter', TRUE, 'acc-500100', 'Tea, juices, and drinks', TRUE),
('dept-packing', 'DEP-04', 'Packing & Parcel Station', FALSE, 'acc-600300', 'Takeaway packaging section', TRUE),
('dept-housekeeping', 'DEP-05', 'Housekeeping & Cleaning', FALSE, 'acc-600400', 'Sanitation and hygiene supplies', TRUE),
('dept-store', 'DEP-06', 'Central Store', FALSE, 'acc-100200', 'Raw material buffer store', TRUE)
ON CONFLICT (id) DO NOTHING;

