import { unstable_cache } from "next/cache"
import { endOfDay, endOfMonth, startOfMonth } from "date-fns"
import { Prisma } from "../generated/prisma/client"

import { prisma } from "../prisma"

type CategoryBreakdownItem = {
  categoryId: string | null
  name: string
  icon: string
  color: string
  total: string
}

type CashFlowPoint = {
  date: string
  income: number
  expenses: number
}

type DashboardSummary = {
  totalBalance: string
  monthlyIncome: string
  monthlyExpenses: string
  categoryBreakdown: CategoryBreakdownItem[]
  cashFlow: CashFlowPoint[]
}

export type DashboardSummaryFilters = {
  accountId?: string
  from?: Date
  to?: Date
}

const resolveRange = (filters: DashboardSummaryFilters) => {
  const now = new Date()
  const baseDate = filters.from ?? filters.to ?? now
  const start = filters.from ?? startOfMonth(baseDate)
  const end = filters.to ? endOfDay(filters.to) : endOfMonth(baseDate)
  return { start, end }
}

const buildCashFlow = (
  transactions: { date: Date; amount: Prisma.Decimal; type: "INCOME" | "EXPENSE" | "TRANSFER" }[]
): CashFlowPoint[] => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  })
  const grouped = new Map<string, { income: number; expenses: number }>()

  transactions.forEach((transaction) => {
    const key = formatter.format(transaction.date)
    const entry = grouped.get(key) ?? { income: 0, expenses: 0 }
    const amount = Number(transaction.amount)

    if (transaction.type === "INCOME") {
      entry.income += amount
    } else if (transaction.type === "EXPENSE") {
      entry.expenses += amount
    }

    grouped.set(key, entry)
  })

  return Array.from(grouped.entries()).map(([date, totals]) => ({
    date,
    income: totals.income,
    expenses: totals.expenses,
  }))
}

export async function getDashboardSummary(
  userId: string,
  filters: DashboardSummaryFilters = {}
): Promise<DashboardSummary> {
  const { start, end } = resolveRange(filters)
  const now = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  const cashFlowStart = filters.from ?? thirtyDaysAgo
  const cashFlowEnd = filters.to ? endOfDay(filters.to) : now
  const accountFilter = filters.accountId
    ? { financialAccountId: filters.accountId }
    : {}
  const accountBalanceFilter = filters.accountId
    ? { id: filters.accountId }
    : {}
  const rangeFilter = { date: { gte: start, lte: end } }
  const cacheKey = [
    "summary",
    userId,
    JSON.stringify({
      accountId: filters.accountId ?? "",
      from: filters.from?.toISOString(),
      to: filters.to?.toISOString(),
    }),
  ]

  const cached = unstable_cache(
    async () => {
      const [
        balanceAgg,
        monthlyIncomeAgg,
        monthlyExpenseAgg,
        totalIncomeAgg,
        totalExpenseAgg,
        categoryGroups,
        cashFlowRows,
      ] = await Promise.all([
          prisma.financialAccount.aggregate({
            where: { userId, ...accountBalanceFilter },
            _sum: { balance: true },
          }),
          prisma.transaction.aggregate({
            where: {
              userId,
              type: "INCOME",
              ...accountFilter,
              ...rangeFilter,
            },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: {
              userId,
              type: "EXPENSE",
              ...accountFilter,
              ...rangeFilter,
            },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: {
              userId,
              type: "INCOME",
              ...accountFilter,
            },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: {
              userId,
              type: "EXPENSE",
              ...accountFilter,
            },
            _sum: { amount: true },
          }),
          prisma.transaction.groupBy({
            by: ["categoryId"],
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
            },
          }),
        ])

      const categoryIds = categoryGroups
        .map((group) => group.categoryId)
        .filter((id): id is string => Boolean(id))

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
        : []

      const categoryMap = new Map(categories.map((item) => [item.id, item]))

      const categoryBreakdown = categoryGroups.map((group) => {
        const total = group._sum.amount?.toString() ?? "0"

        if (!group.categoryId) {
          return {
            categoryId: null,
            name: "Uncategorized",
            icon: "tag",
            color: "#64748b",
            total,
          }
        }

        const category = categoryMap.get(group.categoryId)

        return {
          categoryId: group.categoryId,
          name: category?.name ?? "Unknown",
          icon: category?.icon ?? "tag",
          color: category?.color ?? "#64748b",
          total,
        }
      })

      const baseBalance = balanceAgg._sum.balance ?? new Prisma.Decimal(0)
      const totalIncome = totalIncomeAgg._sum.amount ?? new Prisma.Decimal(0)
      const totalExpense = totalExpenseAgg._sum.amount ?? new Prisma.Decimal(0)
      const rangeIncome = monthlyIncomeAgg._sum.amount ?? new Prisma.Decimal(0)
      const rangeExpense = monthlyExpenseAgg._sum.amount ?? new Prisma.Decimal(0)
      const balanceDelta =
        filters.from || filters.to
          ? rangeIncome.minus(rangeExpense)
          : totalIncome.minus(totalExpense)
      const totalBalance = baseBalance.plus(balanceDelta)

      return {
        totalBalance: totalBalance.toString(),
        monthlyIncome: monthlyIncomeAgg._sum.amount?.toString() ?? "0",
        monthlyExpenses: monthlyExpenseAgg._sum.amount?.toString() ?? "0",
        categoryBreakdown,
        cashFlow: buildCashFlow(cashFlowRows),
      }
    },
    cacheKey,
    { tags: ["summary"] }
  )

  return cached()
}

export const getSummary = getDashboardSummary
