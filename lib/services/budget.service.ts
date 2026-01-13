import { unstable_cache } from "next/cache"
import { endOfDay, endOfMonth, startOfMonth } from "date-fns"
import { Prisma } from "../generated/prisma/client"

import { prisma } from "../prisma"
import { convertToBaseCurrency } from "./currency.service"
import { getUserCurrencySettings } from "./user.service"

export type BudgetProgress = {
  id: string
  categoryId: string
  categoryName: string
  categoryIcon: string
  categoryColor: string
  limit: string
  spent: string
  percentage: number
}

export type BudgetProgressFilters = {
  accountId?: string
  from?: Date
  to?: Date
}

export async function getBudgetsWithProgress(
  userId: string,
  filters: BudgetProgressFilters = {}
): Promise<BudgetProgress[]> {
  const now = new Date()
  const baseDate = filters.from ?? filters.to ?? now
  const month = baseDate.getMonth() + 1
  const year = baseDate.getFullYear()
  const start = filters.from ?? startOfMonth(baseDate)
  const end = filters.to ? endOfDay(filters.to) : endOfMonth(baseDate)

  const cacheKey = [
    "budgets",
    userId,
    JSON.stringify({
      month: `${year}-${month}`,
      accountId: filters.accountId ?? "",
      from: filters.from?.toISOString(),
      to: filters.to?.toISOString(),
    }),
  ]

  const cached = unstable_cache(
    async () => {
      const currencySettings = await getUserCurrencySettings(userId)
      const budgets = await prisma.budget.findMany({
        where: { userId, month, year },
        select: {
          id: true,
          amount: true,
          categoryId: true,
          category: {
            select: {
              name: true,
              icon: true,
              color: true,
            },
          },
        },
        orderBy: { categoryId: "asc" },
      })

      const categoryIds = budgets.map((budget) => budget.categoryId)
      const [expenseGroups, accounts] = await Promise.all([
        categoryIds.length
          ? prisma.transaction.groupBy({
              by: ["categoryId", "financialAccountId"],
              where: {
                userId,
                type: "EXPENSE",
                categoryId: { in: categoryIds },
                ...(filters.accountId
                  ? { financialAccountId: filters.accountId }
                  : {}),
                date: { gte: start, lte: end },
              },
              _sum: { amount: true },
            })
          : Promise.resolve([]),
        prisma.financialAccount.findMany({
          where: { userId },
          select: {
            id: true,
            currency: true,
          },
        }),
      ])

      const accountMap = new Map(
        accounts.map((account) => [account.id, { currency: account.currency }])
      )

      const expenseMap = new Map<string, Prisma.Decimal>()
      const zero = new Prisma.Decimal(0)

      expenseGroups.forEach((group) => {
        const categoryId = group.categoryId ?? ""
        const amount = group._sum.amount ?? zero
        const currency = accountMap.get(group.financialAccountId)?.currency
        const converted = convertToBaseCurrency(amount, currency, currencySettings)
        const existing = expenseMap.get(categoryId) ?? zero
        expenseMap.set(categoryId, existing.plus(converted))
      })

      return budgets.map((budget) => {
        const limit = convertToBaseCurrency(
          new Prisma.Decimal(budget.amount),
          "USD",
          currencySettings
        )
        const spent = expenseMap.get(budget.categoryId) ?? new Prisma.Decimal(0)
        const percentage = limit.isZero()
          ? 0
          : spent.div(limit).times(100).toNumber()

        return {
          id: budget.id,
          categoryId: budget.categoryId,
          categoryName: budget.category.name,
          categoryIcon: budget.category.icon,
          categoryColor: budget.category.color,
          limit: limit.toString(),
          spent: spent.toString(),
          percentage,
        }
      })
    },
    cacheKey,
    { tags: ["budgets", "transactions"] }
  )

  return cached()
}
