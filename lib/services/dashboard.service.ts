import { unstable_cache } from "next/cache"
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

const getMonthRange = (reference = new Date()) => {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1)
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 1)
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
  userId: string
): Promise<DashboardSummary> {
  const { start, end } = getMonthRange()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  const cacheKey = ["summary", userId, start.toISOString()]

  const cached = unstable_cache(
    async () => {
      const [balanceAgg, incomeAgg, expenseAgg, categoryGroups, cashFlowRows] =
        await Promise.all([
          prisma.financialAccount.aggregate({
            where: { userId },
            _sum: { balance: true },
          }),
          prisma.transaction.aggregate({
            where: {
              userId,
              type: "INCOME",
              date: { gte: start, lt: end },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: {
              userId,
              type: "EXPENSE",
              date: { gte: start, lt: end },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.groupBy({
            by: ["categoryId"],
            where: {
              userId,
              type: "EXPENSE",
              date: { gte: start, lt: end },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.findMany({
            where: {
              userId,
              date: { gte: thirtyDaysAgo, lte: new Date() },
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

      return {
        totalBalance: balanceAgg._sum.balance?.toString() ?? "0",
        monthlyIncome: incomeAgg._sum.amount?.toString() ?? "0",
        monthlyExpenses: expenseAgg._sum.amount?.toString() ?? "0",
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
