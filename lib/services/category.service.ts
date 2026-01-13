import { unstable_cache } from "next/cache";
import { endOfMonth, startOfMonth } from "date-fns";
import { Prisma } from "../../../prisma/@/lib/generated/prisma/client";

import { prisma } from "../prisma";

export type CategoryWithStats = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
  icon: string;
  transactionCount: number;
  monthlySpend: string;
};

export async function getCategoriesWithStats(
  userId: string
): Promise<CategoryWithStats[]> {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  const cacheKey = ["categories", userId, start.toISOString()];

  const cached = unstable_cache(
    async () => {
      const categories = await prisma.category.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          type: true,
          icon: true,
          color: true,
          _count: {
            select: { transactions: true },
          },
        },
        orderBy: { name: "asc" },
      });

      const categoryIds = categories.map((category) => category.id);
      const monthlyExpenseGroups = categoryIds.length
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
        : [];

      const monthlySpendMap = new Map(
        monthlyExpenseGroups.map((group) => [
          group.categoryId ?? "",
          group._sum.amount ?? new Prisma.Decimal(0),
        ])
      );

      return categories.map((category) => ({
        id: category.id,
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon,
        transactionCount: category._count.transactions,
        monthlySpend: monthlySpendMap.get(category.id)?.toString() ?? "0",
      }));
    },
    cacheKey,
    { tags: ["categories"] }
  );

  return cached();
}
