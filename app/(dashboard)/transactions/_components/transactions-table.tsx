"use client"

import { Tag, Wallet } from "lucide-react"

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
}: TransactionsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
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

