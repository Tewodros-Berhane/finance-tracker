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

type SearchParamsLike =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | undefined

const isURLSearchParams = (
  params: SearchParamsLike
): params is URLSearchParams =>
  Boolean(params) && typeof (params as URLSearchParams).get === "function"

const getSearchParam = (params: SearchParamsLike, key: string) => {
  if (!params) return undefined
  if (isURLSearchParams(params)) {
    return params.get(key) ?? undefined
  }
  const value = (params as Record<string, string | string[] | undefined>)[key]
  return Array.isArray(value) ? value[0] : value
}

const parseDate = (value: string | undefined) => {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function TransactionsTableSkeleton() {
  return (
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
  )
}

type TransactionsResult = Awaited<ReturnType<typeof getTransactions>>

type TransactionsTableSectionProps = {
  transactionsPromise: Promise<TransactionsResult>
  accountOptions: { label: string; value: string }[]
  categoryOptions: { label: string; value: string }[]
  modalAccounts: { id: string; name: string; currency: string }[]
  modalCategories: { id: string; name: string; type: "INCOME" | "EXPENSE" }[]
  currentPage: number
  pageSize: number
}

async function TransactionsTableSection({
  transactionsPromise,
  accountOptions,
  categoryOptions,
  modalAccounts,
  modalCategories,
  currentPage,
  pageSize,
}: TransactionsTableSectionProps) {
  const transactionsResult = await transactionsPromise

  interface TransactionWithRelations {
    id: string
    date: string
    description?: string | null
    category?: {
      id: string
      name: string
      color?: string | null
      icon?: string | null
    } | null
    financialAccount: {
      id: string
      name: string
      currency?: string | null
    }
    type: "INCOME" | "EXPENSE" | "TRANSFER"
    amount: string
    isRecurring: boolean
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
    isRecurring: boolean
  }

  const tableData: TransactionsTableRow[] = transactionsResult.transactions.map(
    (transaction: TransactionWithRelations) => ({
      id: transaction.id,
      date: transaction.date,
      description: transaction.description ?? "",
      categoryId: transaction.category?.id ?? "uncategorized",
      categoryName: transaction.category?.name ?? "Uncategorized",
      categoryColor: transaction.category?.color ?? null,
      categoryIcon: transaction.category?.icon ?? null,
      accountId: transaction.financialAccount.id,
      accountName: transaction.financialAccount.name,
      accountCurrency: transaction.financialAccount.currency ?? "USD",
      type: transaction.type,
      amount: String(transaction.amount),
      isRecurring: transaction.isRecurring,
    })
  )

  if (tableData.length === 0) {
    return (
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
    )
  }

  return (
    <TransactionsTable
      data={tableData}
      accounts={accountOptions}
      categories={categoryOptions}
      formAccounts={modalAccounts}
      formCategories={modalCategories}
      currentPage={currentPage}
      totalPages={transactionsResult.totalPages}
      pageSize={pageSize}
    />
  )
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect("/sign-in")
  }

  const userId = user.id

  const limitValue = getSearchParam(resolvedSearchParams, "limit")
  const parsedLimit = limitValue ? Number(limitValue) : Number.NaN
  const pageSize =
    Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10
  const pageValue = getSearchParam(resolvedSearchParams, "page")
  const parsedPage = pageValue ? Number(pageValue) : Number.NaN
  const page =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const categoryId =
    getSearchParam(resolvedSearchParams, "categoryId") ??
    getSearchParam(resolvedSearchParams, "category")
  const accountId =
    getSearchParam(resolvedSearchParams, "accountId") ??
    getSearchParam(resolvedSearchParams, "account")
  const from =
    parseDate(getSearchParam(resolvedSearchParams, "startDate")) ??
    parseDate(getSearchParam(resolvedSearchParams, "from"))
  const to =
    parseDate(getSearchParam(resolvedSearchParams, "endDate")) ??
    parseDate(getSearchParam(resolvedSearchParams, "to"))

  const transactionsPromise = getTransactions(userId, {
    limit: pageSize,
    page,
    accountId: accountId ?? undefined,
    categoryId: categoryId ?? undefined,
    from,
    to,
  })

  const [accounts, categories] = await Promise.all([
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

  const accountOptions = accounts.map((account) => ({
    label: account.name,
    value: account.id,
  }))

  const categoryOptions = [
    ...categories.map((category) => ({
      label: category.name,
      value: category.id,
    })),
    { label: "Uncategorized", value: "uncategorized" },
  ]

  const modalAccounts = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    currency: account.currency ?? "USD",
  }))

  const modalCategories = categories.map((category) => ({
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

      <Suspense fallback={<TransactionsTableSkeleton />}>
        <TransactionsTableSection
          transactionsPromise={transactionsPromise}
          accountOptions={accountOptions}
          categoryOptions={categoryOptions}
          modalAccounts={modalAccounts}
          modalCategories={modalCategories}
          currentPage={page}
          pageSize={pageSize}
        />
      </Suspense>
    </div>
  )
}
