import { Suspense } from "react"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/services/auth.service"
import { getTransactions } from "@/lib/services/transaction.service"
import { createMetadata } from "@/lib/seo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { AddTransactionModal } from "./_components/add-transaction-modal"
import { TransactionsTable } from "./_components/transactions-table"

type TransactionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export const metadata = createMetadata({
  title: "Transactions",
  description: "Review and manage your transaction ledger across accounts.",
  canonical: "/transactions",
})

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

const parseDate = (value: string | undefined) => {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function TransactionsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <Card>
        <CardContent className="space-y-4 py-6">
          <Skeleton className="h-8 w-72" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

async function TransactionsContent({ searchParams }: TransactionsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect("/sign-in")
  }

  const userId = user.id

  const page = Number(getParam(resolvedSearchParams?.page)) || 1
  const limit = Number(getParam(resolvedSearchParams?.limit)) || undefined
  const categoryId =
    getParam(resolvedSearchParams?.categoryId) ??
    getParam(resolvedSearchParams?.category)
  const accountId =
    getParam(resolvedSearchParams?.accountId) ??
    getParam(resolvedSearchParams?.account)
  const from =
    parseDate(getParam(resolvedSearchParams?.startDate)) ??
    parseDate(getParam(resolvedSearchParams?.from))
  const to =
    parseDate(getParam(resolvedSearchParams?.endDate)) ??
    parseDate(getParam(resolvedSearchParams?.to))

  const [transactionsResult, accounts, categories] = await Promise.all([
    getTransactions(userId, {
      page,
      limit,
      accountId: accountId ?? undefined,
      categoryId: categoryId ?? undefined,
      from,
      to,
    }),
    prisma.financialAccount.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        currency: true,
      },
    }),
    prisma.category.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        type: true,
      },
    }),
  ])

  interface TransactionCategory {
    id: string
    name: string
    color?: string | null
    icon?: string | null
  }

  interface FinancialAccount {
    id: string
    name: string
    currency?: string | null
  }

  interface TransactionWithRelations {
    id: string
    date: string
    description?: string | null
    category?: TransactionCategory | null
    financialAccount: FinancialAccount
    type: "INCOME" | "EXPENSE" | "TRANSFER"
    amount: string
  }

  interface TransactionsTableRow {
    id: string
    date: string
    description: string
    categoryId: string
    categoryName: string
    categoryColor: string | null
    categoryIcon: string | null
    accountId: string
    accountName: string
    accountCurrency: string
    type: "INCOME" | "EXPENSE" | "TRANSFER"
    amount: string
  }

  const tableData: TransactionsTableRow[] = transactionsResult.data.map(
    (transaction: TransactionWithRelations) => ({
      id: transaction.id,
      date: transaction.date,
      description: transaction.description ?? "Untitled transaction",
      categoryId: transaction.category?.id ?? "uncategorized",
      categoryName: transaction.category?.name ?? "Uncategorized",
      categoryColor: transaction.category?.color ?? null,
      categoryIcon: transaction.category?.icon ?? null,
      accountId: transaction.financialAccount.id,
      accountName: transaction.financialAccount.name,
      accountCurrency: transaction.financialAccount.currency ?? "USD",
      type: transaction.type,
      amount: String(transaction.amount),
    })
  )

  interface AccountOption {
    label: string
    value: string
  }

  const accountOptions: AccountOption[] = accounts.map(
    (account: FinancialAccount) => ({
      label: account.name,
      value: account.id,
    })
  )

  interface Category {
    id: string
    name: string
    type?: "INCOME" | "EXPENSE" | "TRANSFER" | null
  }

  interface CategoryOption {
    label: string
    value: string
  }

  const categoryOptions: CategoryOption[] = [
    ...categories.map((category: Category) => ({
      label: category.name,
      value: category.id,
    })),
    { label: "Uncategorized", value: "uncategorized" },
  ]

  const modalAccounts = accounts.map((account: FinancialAccount) => ({
    id: account.id,
    name: account.name,
    currency: account.currency ?? "USD",
  }))

  const modalCategories = categories
    .filter(
      (category): category is Category & { type: "INCOME" | "EXPENSE" } =>
        category.type === "INCOME" || category.type === "EXPENSE"
    )
    .map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type,
    }))

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground text-sm">
            Track every movement across your accounts.
          </p>
        </div>
        <AddTransactionModal
          accounts={modalAccounts}
          categories={modalCategories}
          trigger={<Button size="sm">Add Transaction</Button>}
        />
      </header>

      {tableData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No transactions found. Add one to start tracking.
            </p>
            <AddTransactionModal
              accounts={modalAccounts}
              categories={modalCategories}
              trigger={<Button variant="outline">Create Transaction</Button>}
            />
          </CardContent>
        </Card>
      ) : null}

      <TransactionsTable
        data={tableData}
        accounts={accountOptions}
        categories={categoryOptions}
        page={transactionsResult.meta.page}
        pageSize={transactionsResult.meta.limit}
        total={transactionsResult.meta.total}
      />
    </div>
  )
}

export default function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  return (
    <Suspense fallback={<TransactionsSkeleton />}>
      <TransactionsContent searchParams={searchParams} />
    </Suspense>
  )
}
