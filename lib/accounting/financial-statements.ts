import { Account, JournalEntry, TrialBalanceReport, TrialBalanceRow } from '../../types/accounting';
import { round2 } from '../utils/formatters';

export interface IncomeStatementReport {
  startDate: string;
  endDate: string;
  revenue: {
    restaurantSales: number;
    otherIncome: number;
    totalRevenue: number;
  };
  cogs: {
    kitchenConsumption: number;
    wastageAndSpoilage: number;
    totalCogs: number;
  };
  grossProfit: number;
  grossProfitMargin: number; // percentage
  operatingExpenses: {
    category: string;
    amount: number;
  }[];
  totalOperatingExpenses: number;
  netProfit: number;
  netProfitMargin: number; // percentage
}

export interface BalanceSheetReport {
  asOfDate: string;
  assets: {
    currentAssets: { accountName: string; code: string; amount: number }[];
    totalCurrentAssets: number;
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: { accountName: string; code: string; amount: number }[];
    totalCurrentLiabilities: number;
    totalLiabilities: number;
  };
  equity: {
    ownersCapital: number;
    retainedEarnings: number;
    currentPeriodProfit: number;
    totalEquity: number;
  };
  isBalanced: boolean;
  difference: number;
}

/**
 * Generates the Trial Balance for a given date range
 */
export function generateTrialBalance(
  accounts: Account[],
  journalEntries: JournalEntry[],
  asOfDate?: string
): TrialBalanceReport {
  const filteredEntries = asOfDate
    ? journalEntries.filter((j) => j.date <= asOfDate)
    : journalEntries;

  let totalDebit = 0;
  let totalCredit = 0;

  const rows: TrialBalanceRow[] = accounts
    .map((acc) => {
      let accDebit = 0;
      let accCredit = 0;

      for (const je of filteredEntries) {
        for (const line of je.lines) {
          if (line.accountId === acc.id || line.accountCode === acc.code) {
            accDebit += line.debit || 0;
            accCredit += line.credit || 0;
          }
        }
      }

      accDebit = round2(accDebit);
      accCredit = round2(accCredit);

      // Determine net position based on normal balance
      let netDebit = 0;
      let netCredit = 0;

      if (acc.normalBalance === 'DEBIT') {
        const net = accDebit - accCredit;
        if (net >= 0) {
          netDebit = net;
        } else {
          netCredit = Math.abs(net);
        }
      } else {
        const net = accCredit - accDebit;
        if (net >= 0) {
          netCredit = net;
        } else {
          netDebit = Math.abs(net);
        }
      }

      totalDebit += netDebit;
      totalCredit += netCredit;

      return {
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        category: acc.category,
        debit: round2(netDebit),
        credit: round2(netCredit),
      };
    })
    .filter((r) => r.debit > 0 || r.credit > 0);

  totalDebit = round2(totalDebit);
  totalCredit = round2(totalCredit);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return {
    date: asOfDate || new Date().toISOString().split('T')[0],
    rows,
    totalDebit,
    totalCredit,
    isBalanced,
  };
}

/**
 * Generates the Income Statement (P&L) for a period
 */
export function generateIncomeStatement(
  accounts: Account[],
  journalEntries: JournalEntry[],
  startDate: string,
  endDate: string
): IncomeStatementReport {
  const filteredEntries = journalEntries.filter(
    (j) => j.date >= startDate && j.date <= endDate
  );

  let restaurantSales = 0;
  let otherIncome = 0;
  let kitchenConsumption = 0;
  let wastageAndSpoilage = 0;
  const expenseMap = new Map<string, number>();

  for (const je of filteredEntries) {
    for (const line of je.lines) {
      const acc = accounts.find((a) => a.id === line.accountId || a.code === line.accountCode);
      if (!acc) continue;

      const netCredit = round2((line.credit || 0) - (line.debit || 0));
      const netDebit = round2((line.debit || 0) - (line.credit || 0));

      if (acc.category === 'REVENUE') {
        if (acc.code === '400100') {
          restaurantSales += netCredit;
        } else {
          otherIncome += netCredit;
        }
      } else if (acc.category === 'EXPENSE') {
        if (acc.code === '500100') {
          kitchenConsumption += netDebit;
        } else if (acc.code === '600900') {
          wastageAndSpoilage += netDebit;
        } else {
          const prev = expenseMap.get(acc.name) || 0;
          expenseMap.set(acc.name, prev + netDebit);
        }
      }
    }
  }

  restaurantSales = round2(restaurantSales);
  otherIncome = round2(otherIncome);
  const totalRevenue = round2(restaurantSales + otherIncome);

  kitchenConsumption = round2(kitchenConsumption);
  wastageAndSpoilage = round2(wastageAndSpoilage);
  const totalCogs = round2(kitchenConsumption + wastageAndSpoilage);

  const grossProfit = round2(totalRevenue - totalCogs);
  const grossProfitMargin = totalRevenue > 0 ? round2((grossProfit / totalRevenue) * 100) : 0;

  const operatingExpenses = Array.from(expenseMap.entries())
    .map(([category, amount]) => ({ category, amount: round2(amount) }))
    .filter((e) => e.amount > 0);

  const totalOperatingExpenses = round2(operatingExpenses.reduce((s, e) => s + e.amount, 0));
  const netProfit = round2(grossProfit - totalOperatingExpenses);
  const netProfitMargin = totalRevenue > 0 ? round2((netProfit / totalRevenue) * 100) : 0;

  return {
    startDate,
    endDate,
    revenue: {
      restaurantSales,
      otherIncome,
      totalRevenue,
    },
    cogs: {
      kitchenConsumption,
      wastageAndSpoilage,
      totalCogs,
    },
    grossProfit,
    grossProfitMargin,
    operatingExpenses,
    totalOperatingExpenses,
    netProfit,
    netProfitMargin,
  };
}

/**
 * Generates the Balance Sheet
 * Accounting Equation: Assets = Liabilities + Equity
 */
export function generateBalanceSheet(
  accounts: Account[],
  journalEntries: JournalEntry[],
  asOfDate: string
): BalanceSheetReport {
  const trialBalance = generateTrialBalance(accounts, journalEntries, asOfDate);

  const currentAssets: { accountName: string; code: string; amount: number }[] = [];
  const currentLiabilities: { accountName: string; code: string; amount: number }[] = [];
  let ownersCapital = 0;
  let retainedEarnings = 0;

  let totalAssets = 0;
  let totalLiabilities = 0;

  for (const row of trialBalance.rows) {
    if (row.category === 'ASSET') {
      const net = row.debit - row.credit;
      currentAssets.push({ accountName: row.accountName, code: row.accountCode, amount: net });
      totalAssets += net;
    } else if (row.category === 'LIABILITY') {
      const net = row.credit - row.debit;
      currentLiabilities.push({ accountName: row.accountName, code: row.accountCode, amount: net });
      totalLiabilities += net;
    } else if (row.category === 'EQUITY') {
      const net = row.credit - row.debit;
      if (row.accountCode === '300100') {
        ownersCapital += net;
      } else {
        retainedEarnings += net;
      }
    }
  }

  // Calculate current period net profit from Revenue and Expense accounts
  let periodRevenue = 0;
  let periodExpense = 0;
  for (const row of trialBalance.rows) {
    if (row.category === 'REVENUE') {
      periodRevenue += row.credit - row.debit;
    } else if (row.category === 'EXPENSE') {
      periodExpense += row.debit - row.credit;
    }
  }
  const currentPeriodProfit = round2(periodRevenue - periodExpense);

  const totalEquity = round2(ownersCapital + retainedEarnings + currentPeriodProfit);
  totalAssets = round2(totalAssets);
  totalLiabilities = round2(totalLiabilities);

  const difference = round2(Math.abs(totalAssets - (totalLiabilities + totalEquity)));
  const isBalanced = difference < 0.05;

  return {
    asOfDate,
    assets: {
      currentAssets,
      totalCurrentAssets: totalAssets,
      totalAssets,
    },
    liabilities: {
      currentLiabilities,
      totalCurrentLiabilities: totalLiabilities,
      totalLiabilities,
    },
    equity: {
      ownersCapital: round2(ownersCapital),
      retainedEarnings: round2(retainedEarnings),
      currentPeriodProfit,
      totalEquity,
    },
    isBalanced,
    difference,
  };
}

