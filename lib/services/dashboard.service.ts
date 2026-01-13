import { unstable_cache } from "next/cache";
import { endOfDay, endOfMonth, startOfMonth } from "date-fns";
import { Prisma } from "./../../prisma/@/lib/generated/prisma/client";

import { prisma } from "../prisma";
import {
  convertToBaseCurrency,
  type CurrencySettings,
} from "./currency.service";
import { getUserCurrencySettings } from "./user.service";

type CategoryBreakdownItem = {
  categoryId: string | null;
  name: string;
  icon: string;
  color: string;
  total: string;
};

type CashFlowPoint = {
  date: string;
  income: number;
  expenses: number;
};

type DashboardSummary = {
  totalBalance: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  categoryBreakdown: CategoryBreakdownItem[];
  cashFlow: CashFlowPoint[];
};

export type DashboardSummaryFilters = {
  accountId?: string;
  from?: Date;
  to?: Date;
};

const resolveRange = (filters: DashboardSummaryFilters) => {
  const now = new Date();
  const baseDate = filters.from ?? filters.to ?? now;
  const start = filters.from ?? startOfMonth(baseDate);
  const end = filters.to ? endOfDay(filters.to) : endOfMonth(baseDate);
  return { start, end };
};

const buildCashFlow = (
  transactions: {
    date: Date;
    amount: Prisma.Decimal;
    type: "INCOME" | "EXPENSE";
  }[]
): CashFlowPoint[] => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const grouped = new Map<string, { income: number; expenses: number }>();

  transactions.forEach((transaction) => {
    const key = formatter.format(transaction.date);
    const entry = grouped.get(key) ?? { income: 0, expenses: 0 };
    const amount = Number(transaction.amount);

    if (transaction.type === "INCOME") {
      entry.income += amount;
    } else if (transaction.type === "EXPENSE") {
      entry.expenses += amount;
    }

    grouped.set(key, entry);
  });

  return Array.from(grouped.entries()).map(([date, totals]) => ({
    date,
    income: totals.income,
    expenses: totals.expenses,
  }));
};

type CashFlowTransaction = {
  date: Date;
  amount: Prisma.Decimal;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
};

const isCashFlowTransaction = (
  transaction: CashFlowTransaction
): transaction is CashFlowTransaction & { type: "INCOME" | "EXPENSE" } =>
  transaction.type === "INCOME" || transaction.type === "EXPENSE";

const sumGroupsToBase = (
  groups: {
    financialAccountId: string;
    _sum: { amount: Prisma.Decimal | null };
  }[],
  accountMap: Map<string, { currency: string | null }>,
  settings: CurrencySettings
) => {
  const zero = new Prisma.Decimal(0);

  return groups.reduce((total, group) => {
    const amount = group._sum.amount ?? zero;
    const currency = accountMap.get(group.financialAccountId)?.currency;
    const converted = convertToBaseCurrency(amount, currency, settings);
    return total.plus(converted);
  }, zero);
};

export async function getDashboardSummary(
  userId: string,
  filters: DashboardSummaryFilters = {}
): Promise<DashboardSummary> {
  const { start, end } = resolveRange(filters);
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const cashFlowStart = filters.from ?? thirtyDaysAgo;
  const cashFlowEnd = filters.to ? endOfDay(filters.to) : now;
  const accountFilter = filters.accountId
    ? { financialAccountId: filters.accountId }
    : {};
  const accountBalanceFilter = filters.accountId
    ? { id: filters.accountId }
    : {};
  const rangeFilter = { date: { gte: start, lte: end } };
  const cacheKey = [
    "summary",
    userId,
    JSON.stringify({
      accountId: filters.accountId ?? "",
      from: filters.from?.toISOString(),
      to: filters.to?.toISOString(),
    }),
  ];

  const cached = unstable_cache(
    async () => {
      const currencySettings = await getUserCurrencySettings(userId);
      const [
        accounts,
        rangeIncomeGroups,
        rangeExpenseGroups,
        totalIncomeGroups,
        totalExpenseGroups,
        categoryAccountGroups,
        cashFlowRows,
      ] = await Promise.all([
        prisma.financialAccount.findMany({
          where: { userId, ...accountBalanceFilter },
          select: {
            id: true,
            balance: true,
            currency: true,
          },
        }),
        prisma.transaction.groupBy({
          by: ["financialAccountId"],
          where: {
            userId,
            type: "INCOME",
            ...accountFilter,
            ...rangeFilter,
          },
          _sum: { amount: true },
        }),
        prisma.transaction.groupBy({
          by: ["financialAccountId"],
          where: {
            userId,
            type: "EXPENSE",
            ...accountFilter,
            ...rangeFilter,
          },
          _sum: { amount: true },
        }),
        prisma.transaction.groupBy({
          by: ["financialAccountId"],
          where: {
            userId,
            type: "INCOME",
            ...accountFilter,
          },
          _sum: { amount: true },
        }),
        prisma.transaction.groupBy({
          by: ["financialAccountId"],
          where: {
            userId,
            type: "EXPENSE",
            ...accountFilter,
          },
          _sum: { amount: true },
        }),
        prisma.transaction.groupBy({
          by: ["categoryId", "financialAccountId"],
          where: {
            userId,
            type: "EXPENSE",
            ...accountFilter,
            ...rangeFilter,
          },
          _sum: { amount: true },
        }),
        prisma.transaction.findMany({
          where: {
            userId,
            ...accountFilter,
            date: { gte: cashFlowStart, lte: cashFlowEnd },
            type: { in: ["INCOME", "EXPENSE"] },
          },
          orderBy: { date: "asc" },
          select: {
            date: true,
            amount: true,
            type: true,
            financialAccount: {
              select: { currency: true },
            },
          },
        }),
      ]);

      const accountMap = new Map(
        accounts.map((account) => [account.id, { currency: account.currency }])
      );

      const categoryTotals = new Map<string | null, Prisma.Decimal>();
      const zero = new Prisma.Decimal(0);

      categoryAccountGroups.forEach((group) => {
        const amount = group._sum.amount ?? zero;
        const currency = accountMap.get(group.financialAccountId)?.currency;
        const converted = convertToBaseCurrency(
          amount,
          currency,
          currencySettings
        );
        const key = group.categoryId;
        const existing = categoryTotals.get(key) ?? zero;
        categoryTotals.set(key, existing.plus(converted));
      });

      const categoryIds = Array.from(categoryTotals.keys()).filter(
        (id): id is string => Boolean(id)
      );

      const categories = categoryIds.length
        ? await prisma.category.findMany({
            where: {
              userId,
              id: { in: categoryIds },
            },
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
            },
          })
        : [];

      const categoryMap = new Map(categories.map((item) => [item.id, item]));

      const categoryBreakdown = Array.from(categoryTotals.entries()).map(
        ([categoryId, totalAmount]) => {
          const total = totalAmount.toString();

          if (!categoryId) {
            return {
              categoryId: null,
              name: "Uncategorized",
              icon: "tag",
              color: "#64748b",
              total,
            };
          }

          const category = categoryMap.get(categoryId);

          return {
            categoryId,
            name: category?.name ?? "Unknown",
            icon: category?.icon ?? "tag",
            color: category?.color ?? "#64748b",
            total,
          };
        }
      );

      const balanceBase = accounts.reduce((total, account) => {
        const amount = new Prisma.Decimal(account.balance ?? 0);
        const converted = convertToBaseCurrency(
          amount,
          account.currency,
          currencySettings
        );
        return total.plus(converted);
      }, new Prisma.Decimal(0));

      const rangeIncome = sumGroupsToBase(
        rangeIncomeGroups,
        accountMap,
        currencySettings
      );
      const rangeExpense = sumGroupsToBase(
        rangeExpenseGroups,
        accountMap,
        currencySettings
      );
      const totalIncome = sumGroupsToBase(
        totalIncomeGroups,
        accountMap,
        currencySettings
      );
      const totalExpense = sumGroupsToBase(
        totalExpenseGroups,
        accountMap,
        currencySettings
      );

      const balanceDelta =
        filters.from || filters.to
          ? rangeIncome.minus(rangeExpense)
          : totalIncome.minus(totalExpense);
      const totalBalance = balanceBase.plus(balanceDelta);

      const cashFlow = cashFlowRows.map((row) => ({
        date: row.date,
        type: row.type,
        amount: convertToBaseCurrency(
          row.amount,
          row.financialAccount.currency,
          currencySettings
        ),
      }));

      return {
        totalBalance: totalBalance.toString(),
        monthlyIncome: rangeIncome.toString(),
        monthlyExpenses: rangeExpense.toString(),
        categoryBreakdown,
        cashFlow: buildCashFlow(cashFlow.filter(isCashFlowTransaction)),
      };
    },
    cacheKey,
    { tags: ["summary"] }
  );

  return cached();
}

export const getSummary = getDashboardSummary;
