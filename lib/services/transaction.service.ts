import { unstable_cache } from "next/cache";
import { endOfDay } from "date-fns";
import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";

import { prisma } from "../prisma";

const DEFAULT_LIMIT = 10;
const COUNT_CACHE_SECONDS = 300;

export type TransactionFilters = {
  from?: Date;
  to?: Date;
  accountId?: string;
  categoryId?: string;
  limit?: number;
  page?: number;
};

type TransactionRow = {
  id: string;
  date: string;
  description: string | null;
  amount: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  isRecurring: boolean;
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
  transactions: TransactionRow[];
  totalCount: number;
  totalPages: number;
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

const buildFilterHash = (filters: TransactionFilters) => {
  const payload = {
    from: filters.from?.toISOString() ?? "",
    to: filters.to?.toISOString() ?? "",
    accountId: filters.accountId ?? "",
    categoryId: filters.categoryId ?? "",
  };

  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex")
    .slice(0, 12);
};

export async function getTransactions(
  userId: string,
  filters: TransactionFilters = {}
): Promise<TransactionResult> {
  const limit =
    filters.limit && filters.limit > 0 ? filters.limit : DEFAULT_LIMIT;
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const filterHash = buildFilterHash(filters);

  const where = buildWhereClause(userId, filters);
  const countCacheKey = [
    "transactions-count",
    userId,
    filterHash,
  ];
  const pageCacheKey = [
    "transactions-page",
    userId,
    filterHash,
    `page:${page}`,
    `limit:${limit}`,
  ];

  const cachedCount = unstable_cache(
    async () => prisma.transaction.count({ where }),
    countCacheKey,
    {
      tags: [`transactions-count:${userId}`],
      revalidate: COUNT_CACHE_SECONDS,
    }
  );

  const cachedPage = unstable_cache(
    async () =>
      prisma.transaction.findMany({
        where,
        orderBy: [
          { date: "desc" as const },
          { id: "desc" as const },
        ],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          date: true,
          description: true,
          amount: true,
          type: true,
          isRecurring: true,
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
      }),
    pageCacheKey,
    { tags: [`transactions:${userId}`] }
  );

  const [totalCount, rows] = await Promise.all([
    cachedCount(),
    cachedPage(),
  ]);

  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);

  return {
    transactions: rows.map((row) => ({
      id: row.id,
      date: (
        row.date instanceof Date ? row.date : new Date(row.date)
      ).toISOString(),
      description: row.description,
      amount: row.amount.toString(),
      type: row.type,
      isRecurring: row.isRecurring,
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
    totalCount,
    totalPages,
  };
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
    { tags: [`transactions:${userId}`] }
  );

  return cached();
}
