import { Suspense } from "react"
import { redirect } from "next/navigation"

import { getAuthenticatedUser } from "@/lib/services/auth.service"
import { createMetadata } from "@/lib/seo"
import { getBudgetsWithProgress } from "@/lib/services/budget.service"
import { getSummary } from "@/lib/services/dashboard.service"
import { getRecentTransactions } from "@/lib/services/transaction.service"
import { getUserCurrencySettings } from "@/lib/services/user.service"
import { prisma } from "@/lib/prisma"
import { Skeleton } from "@/components/ui/skeleton"

import { CashFlowChart } from "./_components/cashflow-chart"
import { CategoryBreakdown } from "./_components/category-breakdown"
import { DashboardBudgets, type BudgetIconKey } from "./_components/dashboard-budgets"
import { DashboardFilters } from "./_components/dashboard-filters"
import { RecentTransactions } from "./_components/recent-transactions"
import { StatsGrid } from "./_components/stats-grid"

export const metadata = createMetadata({
  title: "Dashboard",
  description: "View balances, spending trends, and cash flow at a glance.",
  canonical: "/dashboard",
})

const budgetIconMap: Record<string, BudgetIconKey> = {
  shopping: "shopping",
  food: "dining",
  dining: "dining",
  home: "housing",
  rent: "housing",
  transport: "transport",
  car: "transport",
  travel: "transport",
  receipt: "misc",
  tag: "misc",
  wallet: "misc",
  card: "misc",
  gift: "misc",
}

const mapBudgetIcon = (icon: string | null | undefined) =>
  icon ? budgetIconMap[icon] : undefined

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

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

const parseDate = (value: string | undefined) => {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

async function DashboardContent({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect("/sign-in")
  }

  const userId = user.id
  const accountId =
    getParam(resolvedSearchParams?.account) ??
    getParam(resolvedSearchParams?.accountId)
  const from =
    parseDate(getParam(resolvedSearchParams?.from)) ??
    parseDate(getParam(resolvedSearchParams?.startDate))
  const to =
    parseDate(getParam(resolvedSearchParams?.to)) ??
    parseDate(getParam(resolvedSearchParams?.endDate))
  const summaryFilters = {
    accountId: accountId ?? undefined,
    from,
    to,
  }
  const [summary, recent, accounts, budgets, currencySettings] =
    await Promise.all([
    getSummary(userId, summaryFilters),
    getRecentTransactions(userId, { limit: 5, ...summaryFilters }),
    prisma.financialAccount.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
    getBudgetsWithProgress(userId, summaryFilters),
    getUserCurrencySettings(userId),
  ])

  const recentTransactions = recent.map((transaction: { id: any; category: { name: any; icon: any }; description: any; financialAccount: { name: any; currency: any }; date: any; amount: any; type: any }) => ({
    id: transaction.id,
    category: transaction.category?.name ?? "Uncategorized",
    description: transaction.description ?? "Untitled transaction",
    accountName: transaction.financialAccount.name,
    date: transaction.date,
    amount: Number(transaction.amount),
    type: transaction.type,
    icon: transaction.category?.icon,
    currency: transaction.financialAccount.currency ?? currencySettings.baseCurrency,
  }))

  const budgetAlerts = budgets.map((budget: { id: any; categoryName: any; spent: any; limit: any; categoryIcon: string | null | undefined }) => ({
    id: budget.id,
    category: budget.categoryName,
    spent: Number(budget.spent),
    limit: Number(budget.limit),
    icon: mapBudgetIcon(budget.categoryIcon),
  }))

  const categoryData = summary.categoryBreakdown.map((item: { name: any; total: any }) => ({
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
        <DashboardFilters accounts={accounts} />
      </header>

      <StatsGrid
        totalBalance={Number(summary.totalBalance)}
        monthlyIncome={Number(summary.monthlyIncome)}
        monthlyExpenses={Number(summary.monthlyExpenses)}
        currency={currencySettings.baseCurrency}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <CashFlowChart data={summary.cashFlow} />
        <CategoryBreakdown
          data={categoryData}
          currency={currencySettings.baseCurrency}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTransactions data={recentTransactions} />
        </div>
        <DashboardBudgets
          data={budgetAlerts}
          currency={currencySettings.baseCurrency}
        />
      </div>
    </div>
  )
}

export default function DashboardPage({ searchParams }: DashboardPageProps) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  )
}
