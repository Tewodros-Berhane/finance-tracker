import { unstable_cache } from "next/cache"
import { endOfMonth, startOfMonth } from "date-fns"
import { Prisma } from "../generated/prisma/client"

import { prisma } from "../prisma"

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

export async function getBudgetsWithProgress(
  userId: string
): Promise<BudgetProgress[]> {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const start = startOfMonth(now)
  const end = endOfMonth(now)

  const cacheKey = ["budgets", userId, `${year}-${month}`]

  const cached = unstable_cache(
    async () => {
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
      const expenseGroups = categoryIds.length
        ? await prisma.transaction.groupBy({
            by: ["categoryId"],
            where: {
              userId,
              type: "EXPENSE",
              categoryId: { in: categoryIds },
              date: { gte: start, lte: end },
            },
            _sum: { amount: true },
          })
        : []

      const expenseMap = new Map(
        expenseGroups.map((group) => [
          group.categoryId ?? "",
          group._sum.amount ?? new Prisma.Decimal(0),
        ])
      )

      return budgets.map((budget) => {
        const limit = new Prisma.Decimal(budget.amount)
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
