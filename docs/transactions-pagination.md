# Transactions Pagination (Server-Side + Performance)

This document explains the Transactions pagination architecture in Vantage, including the performance optimizations added for large datasets.

## Overview

Pagination is **server-side** and **URL-driven**:
- The page reads `?page=` (and optional `?limit=`) from the URL.
- The server fetches only the rows for that page using Prisma `skip`/`take`.
- The UI renders a shadcn Pagination component that updates the URL.
- The table is streamed with Suspense to avoid blocking the header.

The URL is the source of truth. There is no client-side pagination state.

## Service Layer

File: `lib/services/transaction.service.ts`

### Function signature
```
getTransactions(userId, filters) -> {
  transactions: TransactionRow[],
  totalCount: number,
  totalPages: number
}
```

### Pagination logic
- `limit` defaults to **10** (`DEFAULT_LIMIT`).
- `page` defaults to **1**.
- `skip` is `(page - 1) * limit`.
- `take` is `limit`.

### Deterministic ordering
```
orderBy: [{ date: "desc" }, { id: "desc" }]
```

### Filter hash + granular cache keys
Filters are hashed (`buildFilterHash`) and used in cache keys so different filter sets do not collide.

Page cache key example:
```
["transactions-page", userId, filterHash, "page:2", "limit:10"]
```

Count cache key example:
```
["transactions-count", userId, filterHash]
```

### Count caching (longer TTL)
`totalCount` is cached separately with a longer TTL:
```
revalidate: 300 // 5 minutes
```

This makes pagination metadata stable and fast without recalculating count on every page request.

### Parallel queries
Count and data are fetched in parallel:
```
const [totalCount, rows] = await Promise.all([count(), findMany()])
```

## Prisma Index (Offset Optimization)

To make `skip`/`take` efficient, the orderBy fields are indexed together:
```
@@index([userId, date, id])
```

File: `prisma/schema.prisma`

## API Route (Optional)

File: `app/api/transactions/route.ts`

The API route expects:
- `page` (optional)
- `limit` (optional)

It passes those into `getTransactions()` and returns `{ data, meta }`.

## Server Page + Streaming

File: `app/(dashboard)/transactions/page.tsx`

### URL parsing
The page extracts:
- `page` (default `1`)
- `limit` (default `10`)
- filters: `accountId`, `categoryId`, `from`, `to`

### Streaming the table
The table fetch is kicked off as a promise:
```
const transactionsPromise = getTransactions(...)
```

Accounts + categories are awaited for the header and filter UI, then the table is streamed:
```
<Suspense fallback={<TransactionsTableSkeleton />}>
  <TransactionsTableSection transactionsPromise={transactionsPromise} ... />
</Suspense>
```

This keeps the header visible while the table loads.

## Pagination UI (shadcn)

File: `app/(dashboard)/transactions/_components/table-pagination.tsx`

### useTransition + prefetch
- `router.push()` is wrapped in `startTransition()` so UI stays responsive.
- `router.prefetch()` runs on hover for next/prev/page links.

### Responsive behavior
- On small screens, only Previous/Next are shown.
- Page numbers are hidden using `hidden sm:inline-flex`.

### Page range logic
For large `totalPages`, the UI shows:
- First page
- Current page
- One page before/after current
- Last page
- Ellipses in between

Example: `1 ... 5 6 7 ... 20`

## Row Numbering

File: `app/(dashboard)/transactions/_components/columns.tsx`

The first column shows a row number (not a checkbox):
```
offset = (currentPage - 1) * pageSize
rowNumber = offset + row.index + 1
```

The offset is passed via `table.meta.pageOffset`.

## Why this stays fast at scale

- Only one page of data is fetched per request.
- `count()` is cached separately with a longer TTL.
- Cache keys are granular per user/page/filter.
- `Promise.all` removes sequential query latency.
- Prefetching warms the next page in advance.
- Suspense streams the table to avoid blocking the header.
