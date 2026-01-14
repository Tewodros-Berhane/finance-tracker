"use client"

import { Tag, Wallet } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

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
  page: number
  pageSize: number
  total: number
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
  page,
  pageSize,
  total,
}: TransactionsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [localPageIndex, setLocalPageIndex] = useState(Math.max(0, page - 1))
  const [localPageSize, setLocalPageSize] = useState(pageSize)
  const pageCount = Math.max(1, Math.ceil(total / localPageSize))

  useEffect(() => {
    setLocalPageIndex(Math.max(0, page - 1))
  }, [page])

  useEffect(() => {
    setLocalPageSize(pageSize)
  }, [pageSize])

  const updateParams = (updates: { page?: number; limit?: number }) => {
    const params = new URLSearchParams(searchParams.toString())

    if (updates.page !== undefined) {
      params.set("page", String(updates.page))
    }

    if (updates.limit !== undefined) {
      params.set("limit", String(updates.limit))
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      pagination={{
        pageIndex: localPageIndex,
        pageSize: localPageSize,
        pageCount,
        total,
        onPageChange: (nextPageIndex) => {
          setLocalPageIndex(nextPageIndex)
          updateParams({ page: nextPageIndex + 1 })
        },
        onPageSizeChange: (nextPageSize) => {
          setLocalPageSize(nextPageSize)
          setLocalPageIndex(0)
          updateParams({ page: 1, limit: nextPageSize })
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
