import { unstable_cache } from "next/cache";
import { endOfDay } from "date-fns";
import type { Prisma } from "@prisma/client";

import { prisma } from "../prisma";

const DEFAULT_LIMIT = 50;

export type TransactionFilters = {
  from?: Date;
  to?: Date;
  accountId?: string;
  categoryId?: string;
  limit?: number;
  cursor?: string;
  direction?: "next" | "prev";
};

type TransactionRow = {
  id: string;
  date: string;
  description: string | null;
  amount: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
  financialAccount: {
    id: string;
    name: string;
    currency: string;
  };
};

type TransactionResult = {
  data: TransactionRow[];
  meta: {
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor: string | null;
    prevCursor: string | null;
  };
};

export type RecentTransaction = {
  id: string;
  date: string;
  description: string | null;
  amount: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  category: {
    name: string;
    icon: string;
  } | null;
  financialAccount: {
    name: string;
    currency: string;
  };
};

export type RecentTransactionFilters = {
  limit?: number;
  accountId?: string;
  from?: Date;
  to?: Date;
};

const buildWhereClause = (
  userId: string,
  filters: TransactionFilters
): Prisma.TransactionWhereInput => {
  const where: Prisma.TransactionWhereInput = { userId };

  if (filters.accountId) {
    where.financialAccountId = filters.accountId;
  }

  if (filters.categoryId) {
    if (filters.categoryId === "uncategorized") {
      where.categoryId = null;
    } else {
      where.categoryId = filters.categoryId;
    }
  }

  if (filters.from || filters.to) {
    where.date = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }

  return where;
};

export async function getTransactions(
  userId: string,
  filters: TransactionFilters = {}
): Promise<TransactionResult> {
  const limit =
    filters.limit && filters.limit > 0 ? filters.limit : DEFAULT_LIMIT;
  const cursor = filters.cursor ?? undefined;
  const direction = filters.direction ?? "next";

  const cacheKey = [
    "transactions",
    userId,
    JSON.stringify({
      from: filters.from?.toISOString(),
      to: filters.to?.toISOString(),
      accountId: filters.accountId ?? "",
      categoryId: filters.categoryId ?? "",
      limit,
      cursor: cursor ?? "",
      direction,
    }),
  ];

  const cached = unstable_cache(
    async () => {
      const where = buildWhereClause(userId, filters);
      const isPrev = direction === "prev" && Boolean(cursor);
      const orderBy = isPrev
        ? [
            { date: "asc" as const },
            { id: "asc" as const },
          ]
        : [
            { date: "desc" as const },
            { id: "desc" as const },
          ];

      const rows = await prisma.transaction.findMany({
        where,
        orderBy,
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        select: {
          id: true,
          date: true,
          description: true,
          amount: true,
          type: true,
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
          financialAccount: {
            select: {
              id: true,
              name: true,
              currency: true,
            },
          },
        },
      });

      const hasExtra = rows.length > limit;
      const sliced = hasExtra ? rows.slice(0, limit) : rows;
      const orderedRows = isPrev ? [...sliced].reverse() : sliced;

      const hasPrev = isPrev ? hasExtra : Boolean(cursor);
      const hasNext = isPrev ? Boolean(cursor) : hasExtra;
      const prevCursor = hasPrev ? orderedRows[0]?.id ?? null : null;
      const nextCursor =
        hasNext ? orderedRows[orderedRows.length - 1]?.id ?? null : null;

      return {
        data: orderedRows.map((row) => ({
          id: row.id,
          date: row.date.toISOString(),
          description: row.description,
          amount: row.amount.toString(),
          type: row.type,
          category: row.category
            ? {
                id: row.category.id,
                name: row.category.name,
                color: row.category.color,
                icon: row.category.icon,
              }
            : null,
          financialAccount: {
            id: row.financialAccount.id,
            name: row.financialAccount.name,
            currency: row.financialAccount.currency,
          },
        })),
        meta: {
          limit,
          hasNext,
          hasPrev,
          nextCursor,
          prevCursor,
        },
      };
    },
    cacheKey,
    { tags: ["transactions"] }
  );

  return cached();
}

export async function getRecentTransactions(
  userId: string,
  filters: RecentTransactionFilters = {}
): Promise<RecentTransaction[]> {
  const limit = filters.limit ?? 5;
  const cacheKey = [
    "recent-transactions",
    userId,
    JSON.stringify({
      limit,
      accountId: filters.accountId ?? "",
      from: filters.from?.toISOString(),
      to: filters.to?.toISOString(),
    }),
  ];

  const cached = unstable_cache(
    async () => {
      const where: Prisma.TransactionWhereInput = { userId };

      if (filters.accountId) {
        where.financialAccountId = filters.accountId;
      }

      if (filters.from || filters.to) {
        where.date = {
          ...(filters.from ? { gte: filters.from } : {}),
          ...(filters.to ? { lte: endOfDay(filters.to) } : {}),
        };
      }

      const rows = await prisma.transaction.findMany({
        where,
        orderBy: { date: "desc" },
        take: limit,
        select: {
          id: true,
          date: true,
          description: true,
          amount: true,
          type: true,
          category: {
            select: {
              name: true,
              icon: true,
            },
          },
          financialAccount: {
            select: {
              name: true,
              currency: true,
            },
          },
        },
      });

      return rows.map((row) => ({
        id: row.id,
        date: row.date.toISOString(),
        description: row.description,
        amount: row.amount.toString(),
        type: row.type,
        category: row.category
          ? {
              name: row.category.name,
              icon: row.category.icon,
            }
          : null,
        financialAccount: {
          name: row.financialAccount.name,
          currency: row.financialAccount.currency,
        },
      }));
    },
    cacheKey,
    { tags: ["transactions"] }
  );

  return cached();
}
