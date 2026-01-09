import { prisma } from "@/lib/prisma"
import { AddTransactionModal } from "@/components/modules/add-transaction-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { TransactionsTable } from "./_components/transactions-table"

export default async function TransactionsPage() {
  const [transactions, accounts, categories] = await Promise.all([
    prisma.transaction.findMany({
      include: {
        category: true,
        financialAccount: true,
      },
      orderBy: {
        date: "desc",
      },
    }),
    prisma.financialAccount.findMany({
      select: {
        id: true,
        name: true,
        currency: true,
      },
    }),
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        type: true,
      },
    }),
  ])

  const tableData = transactions.map((transaction) => ({
    id: transaction.id,
    date: transaction.date.toISOString(),
    description: transaction.description ?? "Untitled transaction",
    categoryId: transaction.category?.id ?? "uncategorized",
    categoryName: transaction.category?.name ?? "Uncategorized",
    categoryColor: transaction.category?.color ?? null,
    categoryIcon: transaction.category?.icon ?? null,
    accountId: transaction.financialAccount.id,
    accountName: transaction.financialAccount.name,
    accountCurrency: transaction.financialAccount.currency ?? "USD",
    type: transaction.type,
    amount: transaction.amount.toString(),
  }))

  // TODO: Remove this mock data once real transactions are seeded.
  const mockTableData = [
    {
      id: "mock-1",
      date: "2024-09-15T09:00:00.000Z",
      description: "Vantage Payroll",
      categoryId: "mock-salary",
      categoryName: "Salary",
      categoryColor: "#16a34a",
      categoryIcon: "tag",
      accountId: "mock-main-checking",
      accountName: "Main Checking",
      accountCurrency: "USD",
      type: "INCOME",
      amount: "5200.00",
    },
    {
      id: "mock-2",
      date: "2024-09-12T14:30:00.000Z",
      description: "Groceries",
      categoryId: "mock-groceries",
      categoryName: "Groceries",
      categoryColor: "#f97316",
      categoryIcon: "shopping",
      accountId: "mock-cash",
      accountName: "Cash",
      accountCurrency: "USD",
      type: "EXPENSE",
      amount: "154.38",
    },
    {
      id: "mock-3",
      date: "2024-09-10T08:10:00.000Z",
      description: "Rent payment",
      categoryId: "mock-housing",
      categoryName: "Housing",
      categoryColor: "#3b82f6",
      categoryIcon: "receipt",
      accountId: "mock-main-checking",
      accountName: "Main Checking",
      accountCurrency: "USD",
      type: "EXPENSE",
      amount: "1650.00",
    },
    {
      id: "mock-4",
      date: "2024-09-08T17:45:00.000Z",
      description: "Dinner",
      categoryId: "mock-dining",
      categoryName: "Dining",
      categoryColor: "#ec4899",
      categoryIcon: "dining",
      accountId: "mock-credit",
      accountName: "Credit Card",
      accountCurrency: "USD",
      type: "EXPENSE",
      amount: "62.50",
    },
    {
      id: "mock-5",
      date: "2024-09-06T11:20:00.000Z",
      description: "Internal transfer",
      categoryId: "uncategorized",
      categoryName: "Transfer",
      categoryColor: "#64748b",
      categoryIcon: "tag",
      accountId: "mock-savings",
      accountName: "Savings",
      accountCurrency: "USD",
      type: "TRANSFER",
      amount: "300.00",
    },
  ] satisfies typeof tableData

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

  const hasRealTransactions = tableData.length > 0
  const displayedRows = hasRealTransactions ? tableData : mockTableData

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground text-sm">
            Track every movement across your accounts.
          </p>
        </div>
        {hasRealTransactions && (
          <AddTransactionModal
            accounts={modalAccounts}
            categories={modalCategories}
            trigger={<Button size="sm">Add Transaction</Button>}
          />
        )}
      </header>

      {!hasRealTransactions && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            {/* TODO: Remove this callout once real data is available. */}
            <p className="text-muted-foreground text-sm">
              Showing sample transactions. Add your first transaction to see
              real data here.
            </p>
            <AddTransactionModal
              accounts={modalAccounts}
              categories={modalCategories}
              trigger={<Button variant="outline">Create Transaction</Button>}
            />
          </CardContent>
        </Card>
      )}

      <TransactionsTable
        // TODO: Swap back to `tableData` only when ready for live data.
        data={displayedRows}
        accounts={accountOptions}
        categories={categoryOptions}
      />
    </div>
  )
}
