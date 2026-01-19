"use client"

import { Loader2, Tag, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { DataTable } from "./data-table"
import { columns, type TransactionRow } from "./columns"
import { AddTransactionModal } from "./add-transaction-modal"
import { TablePagination } from "./table-pagination"
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
  currentPage: number
  totalPages: number
  pageSize: number
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
  currentPage,
  totalPages,
  pageSize,
}: TransactionsTableProps) {
  const router = useRouter()
  const [editing, setEditing] = useState<TransactionRow | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState<TransactionRow | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
        meta={{
          onEdit: handleEdit,
          onDelete: handleDelete,
          pageOffset: (currentPage - 1) * pageSize,
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
      <TablePagination currentPage={currentPage} totalPages={totalPages} />
    </>
  )
}
