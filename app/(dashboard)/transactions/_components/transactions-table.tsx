"use client"

import { Tag, Wallet } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { DataTable } from "./data-table"
import { columns, type TransactionRow } from "./columns"

type FilterOption = {
  label: string
  value: string
}

type TransactionsTableProps = {
  data: TransactionRow[]
  accounts: FilterOption[]
  categories: FilterOption[]
  pageSize: number
  hasNext: boolean
  hasPrev: boolean
  nextCursor: string | null
  prevCursor: string | null
}

const typeOptions = [
  { label: "Income", value: "INCOME" },
  { label: "Expense", value: "EXPENSE" },
  { label: "Transfer", value: "TRANSFER" },
]

export function TransactionsTable({
  data,
  accounts,
  categories,
  pageSize,
  hasNext,
  hasPrev,
  nextCursor,
  prevCursor,
}: TransactionsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const limitParam = Number(searchParams.get("limit"))
  const resolvedPageSize =
    !Number.isNaN(limitParam) && limitParam > 0 ? limitParam : pageSize

  const updateParams = (
    updates: { limit?: number; cursor?: string | null; direction?: "next" | "prev" },
    resetCursor?: boolean
  ) => {
    const params = new URLSearchParams(searchParams.toString())

    if (updates.limit !== undefined) {
      params.set("limit", String(updates.limit))
    }

    if (updates.cursor !== undefined || resetCursor) {
      params.delete("page")
    }

    if (resetCursor) {
      params.delete("cursor")
      params.delete("direction")
    }

    if (updates.cursor !== undefined) {
      if (updates.cursor) {
        params.set("cursor", updates.cursor)
      } else {
        params.delete("cursor")
      }
    }

    if (updates.direction !== undefined) {
      params.set("direction", updates.direction)
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      pagination={{
        mode: "cursor",
        pageSize: resolvedPageSize,
        rowCount: data.length,
        hasNext,
        hasPrev,
        onNext: () => {
          if (!nextCursor) return
          updateParams({ cursor: nextCursor, direction: "next" })
        },
        onPrev: () => {
          if (!prevCursor) return
          updateParams({ cursor: prevCursor, direction: "prev" })
        },
        onPageSizeChange: (nextPageSize) => {
          updateParams({ limit: nextPageSize }, true)
        },
      }}
      toolbar={{
        accounts: accounts.map((option) => ({
          ...option,
          icon: Wallet,
        })),
        categories: categories.map((option) => ({
          ...option,
          icon: Tag,
        })),
        types: typeOptions,
      }}
    />
  )
}
