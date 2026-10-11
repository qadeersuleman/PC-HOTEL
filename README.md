# PC-HOTEL: Restaurant Inventory, Accounting & Vendor Ledger ERP

A professional, full-featured Restaurant Inventory, Accounting, and Vendor Ledger Management System built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase PostgreSQL**.

---

## 🌟 Key Features

### 1. 📊 Executive Dashboard
- Real-time KPIs: Cash/Bank Balance, Inventory Valuation, Accounts Payable, Accounts Receivable, Estimated Food Cost / COGS.
- Department issue summaries, low stock warnings, and transaction feeds.

### 2. 📦 Complete Inventory & Warehouse Management
- **Purchase Invoices**: Multi-line item bills, credit/cash terms, vendor balance tracking, weighted-average costing (WAC).
- **Issue Invoices**: Departmental transfers (Kitchen, BBQ counter, Bar, Packing, Housekeeping, Central Store).
- **Stock Adjustments & Spoilage**: Audited wastage, breakage, expiry, and count reconciliations.
- **Stock Ledger Audit**: Chronological movement history with zero unexplained quantity modifications.

### 3. 👥 Vendor & Customer Ledgers (AP / AR)
- Complete party profiles with running balances, contact info, and payment terms.
- **Accounts Payable (AP)**: Multi-invoice credit tracking, partial settlements, vendor advances.
- **Accounts Receivable (AR)**: Customer credit sales, receipts, and receivables aging report.

### 4. 📑 Financial Vouchers & General Ledger
- **CRV (Cash Receipt Voucher)**: Inbound receipts against invoices or general income.
- **CPV (Cash Payment Voucher)**: Outbound supplier disbursements, vendor advances, expense settlements.
- **JV (Journal Voucher)**: Multi-line balanced double-entry manual adjustments.
- **Standard Chart of Accounts (COA)**: Assets, Liabilities, Equity, Operating Revenue, Direct Food Costs, and Operating Expenses.
- **Automated Double-Entry Posting**: Every invoice, issue, and voucher generates balanced debits and credits automatically.

### 5. 📈 Financial Statements & Reports
- **Trial Balance**: Reconciled debits and credits.
- **Balance Sheet**: Assets = Liabilities + Equity.
- **Final Income Statement**: Net Sales - Estimated COGS = Gross Profit - Operating Expenses = Net Profit.
- **Payables & Receivables Aging**: 0-30, 31-60, 61-90, and 90+ day aging buckets.
- **Inventory Valuation & Movement Reports**.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 16 (App Router with Turbopack) & React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Architecture**: Modular `StorageAdapter` pattern (supports local offline fallback and cloud PostgreSQL)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ installed
- A [Supabase](https://supabase.com) project

### 2. Installation
```bash
git clone https://github.com/qadeersuleman/PC-HOTEL.git
cd PC-HOTEL
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Database Setup
1. Open your Supabase project dashboard -> **SQL Editor** -> **New Query**.
2. Copy and paste the contents of `supabase-schema.sql`.
3. Click **Run** to generate all 13 PostgreSQL tables, Row Level Security policies, and initial Chart of Accounts.

### 5. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security
- Row Level Security (RLS) enabled on all PostgreSQL tables.
- Secrets and keys are safely loaded through environment variables (`.env.local` is git-ignored).
