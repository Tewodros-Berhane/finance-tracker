import { Suspense } from "react"
import { getSummary } from "@/lib/services/dashboard.service"
import { getRecentTransactions } from "@/lib/services/transaction.service"
import { Skeleton } from "@/components/ui/skeleton"

import { CashFlowChart } from "./_components/cashflow-chart"
import { CategoryBreakdown } from "./_components/category-breakdown"
import { DashboardBudgets } from "./_components/dashboard-budgets"
import { DashboardFilters } from "./_components/dashboard-filters"
import { RecentTransactions } from "./_components/recent-transactions"
import { StatsGrid } from "./_components/stats-grid"

const currency = "USD"

const budgetAlerts = [
  {
    id: "budget-1",
    category: "Shopping",
    spent: 450,
    limit: 500,
    icon: "shopping",
  },
  {
    id: "budget-2",
    category: "Dining",
    spent: 320,
    limit: 400,
    icon: "dining",
  },
  {
    id: "budget-3",
    category: "Transportation",
    spent: 210,
    limit: 250,
    icon: "transport",
  },
] satisfies Array<{
  id: string
  category: string
  spent: number
  limit: number
  icon?: "misc" | "shopping" | "dining" | "transport" | "housing"
}>

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-56" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  )
}

async function DashboardContent() {
  const userId = "demo-user"
  const [summary, recent] = await Promise.all([
    getSummary(userId),
    getRecentTransactions(userId, 5),
  ])

  const recentTransactions = recent.map((transaction) => ({
    id: transaction.id,
    category: transaction.category?.name ?? "Uncategorized",
    description: transaction.description ?? "Untitled transaction",
    accountName: transaction.financialAccount.name,
    date: transaction.date,
    amount: Number(transaction.amount),
    type: transaction.type,
    icon: transaction.category?.icon,
  }))

  const categoryData = summary.categoryBreakdown.map((item) => ({
    category: item.name,
    value: Number(item.total),
  }))

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Overview of your finances in one place.
          </p>
        </div>
        <DashboardFilters />
      </header>

      <StatsGrid
        totalBalance={Number(summary.totalBalance)}
        monthlyIncome={Number(summary.monthlyIncome)}
        monthlyExpenses={Number(summary.monthlyExpenses)}
        currency={currency}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <CashFlowChart data={summary.cashFlow} />
        <CategoryBreakdown data={categoryData} currency={currency} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTransactions data={recentTransactions} currency={currency} />
        </div>
        <DashboardBudgets data={budgetAlerts} currency={currency} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
