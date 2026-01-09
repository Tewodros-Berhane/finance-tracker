import { unstable_cache } from "next/cache"
import { Prisma } from "../generated/prisma/client"

import { prisma } from "../prisma"

export type AccountWithBalance = {
  id: string
  name: string
  type: "CHECKING" | "SAVINGS" | "CREDIT" | "CASH" | "INVESTMENT"
  currency: string
  color: string
  icon: string
  currentBalance: string
}

const toDecimalMap = (
  groups: { financialAccountId: string; _sum: { amount: Prisma.Decimal | null } }[]
) => {
  return new Map(
    groups.map((group) => [
      group.financialAccountId,
      group._sum.amount ?? new Prisma.Decimal(0),
    ])
  )
}

export async function getAccountsWithBalances(
  userId: string
): Promise<AccountWithBalance[]> {
  const cacheKey = ["accounts", userId]

  const cached = unstable_cache(
    async () => {
      const [accounts, incomeGroups, expenseGroups, transferInGroups, transferOutGroups] =
        await Promise.all([
          prisma.financialAccount.findMany({
            where: { userId },
            select: {
              id: true,
              name: true,
              type: true,
              balance: true,
              currency: true,
              color: true,
              icon: true,
            },
            orderBy: { name: "asc" },
          }),
          prisma.transaction.groupBy({
            by: ["financialAccountId"],
            where: { userId, type: "INCOME" },
            _sum: { amount: true },
          }),
          prisma.transaction.groupBy({
            by: ["financialAccountId"],
            where: { userId, type: "EXPENSE" },
            _sum: { amount: true },
          }),
          prisma.transaction.groupBy({
            by: ["financialAccountId"],
            where: {
              userId,
              type: "TRANSFER",
              amount: { gt: new Prisma.Decimal(0) },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.groupBy({
            by: ["financialAccountId"],
            where: {
              userId,
              type: "TRANSFER",
              amount: { lt: new Prisma.Decimal(0) },
            },
            _sum: { amount: true },
          }),
        ])

      const incomeMap = toDecimalMap(incomeGroups)
      const expenseMap = toDecimalMap(expenseGroups)
      const transferInMap = toDecimalMap(transferInGroups)
      const transferOutMap = toDecimalMap(transferOutGroups)

      const zero = new Prisma.Decimal(0)

      return accounts.map((account) => {
        const base = new Prisma.Decimal(account.balance)
        const income = incomeMap.get(account.id) ?? zero
        const expense = expenseMap.get(account.id) ?? zero
        const transferIn = transferInMap.get(account.id) ?? zero
        const transferOutRaw = transferOutMap.get(account.id) ?? zero
        const transferOut = transferOutRaw.isNegative()
          ? transferOutRaw.abs()
          : transferOutRaw

        const currentBalance = base
          .plus(income)
          .plus(transferIn)
          .minus(expense)
          .minus(transferOut)

        return {
          id: account.id,
          name: account.name,
          type: account.type,
          currency: account.currency,
          color: account.color,
          icon: account.icon,
          currentBalance: currentBalance.toString(),
        }
      })
    },
    cacheKey,
    { tags: ["accounts"] }
  )

  return cached()
}
