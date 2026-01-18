"use client"

import { Loader2, Tag, Wallet } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { DataTable } from "./data-table"
import { columns, type TransactionRow } from "./columns"
import { AddTransactionModal } from "./add-transaction-modal"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteTransaction } from "@/lib/actions/transaction.actions"

type FilterOption = {
  label: string
  value: string
}

type AccountOption = {
  id: string
  name: string
  currency?: string | null
}

type CategoryOption = {
  id: string
  name: string
  type: "INCOME" | "EXPENSE"
}

type TransactionsTableProps = {
  data: TransactionRow[]
  accounts: FilterOption[]
  categories: FilterOption[]
  formAccounts: AccountOption[]
  formCategories: CategoryOption[]
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
  formAccounts,
  formCategories,
  pageSize,
  hasNext,
  hasPrev,
  nextCursor,
  prevCursor,
}: TransactionsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [editing, setEditing] = useState<TransactionRow | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState<TransactionRow | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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

  const handleEdit = (transaction: TransactionRow) => {
    if (transaction.type === "TRANSFER") {
      toast.error("Transfers cannot be edited yet. Delete and recreate instead.")
      return
    }
    setEditing(transaction)
    setEditOpen(true)
  }

  const handleEditOpenChange = (nextOpen: boolean) => {
    setEditOpen(nextOpen)
    if (!nextOpen) {
      setEditing(null)
    }
  }

  const handleDelete = (transaction: TransactionRow) => {
    setDeleting(transaction)
    setDeleteOpen(true)
  }

  const handleDeleteOpenChange = (nextOpen: boolean) => {
    if (isDeleting) return
    setDeleteOpen(nextOpen)
    if (!nextOpen) {
      setDeleting(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setIsDeleting(true)
    const result = await deleteTransaction({ id: deleting.id })
    setIsDeleting(false)

    if (!result.success) {
      toast.error(result.error ?? "Unable to delete transaction.")
      return
    }

    toast.success("Transaction deleted successfully.")
    setDeleteOpen(false)
    setDeleting(null)
    router.refresh()
  }

  const editTransaction = editing
    ? {
        id: editing.id,
        type: editing.type,
        amount: editing.amount,
        date: editing.date,
        financialAccountId: editing.accountId,
        categoryId:
          editing.categoryId === "uncategorized" ? undefined : editing.categoryId,
        description: editing.description,
        isRecurring: editing.isRecurring,
      }
    : undefined

  return (
    <>
      <AddTransactionModal
        accounts={formAccounts}
        categories={formCategories}
        transaction={editTransaction}
        open={editOpen}
        onOpenChange={handleEditOpenChange}
      />
      <Dialog open={deleteOpen} onOpenChange={handleDeleteOpenChange}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete transaction?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently remove the
              transaction.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isDeleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={confirmDelete}
              className="gap-2"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DataTable
        columns={columns}
        data={data}
        meta={{ onEdit: handleEdit, onDelete: handleDelete }}
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
    </>
  )
}
