import { CashFlowChart } from "./_components/cashflow-chart"
import { CategoryBreakdown } from "./_components/category-breakdown"
import { DashboardBudgets } from "./_components/dashboard-budgets"
import { DashboardFilters } from "./_components/dashboard-filters"
import { RecentTransactions } from "./_components/recent-transactions"
import { StatsGrid } from "./_components/stats-grid"

const currency = "USD"

const buildCashFlowData = () => {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  })

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(now)
    date.setDate(now.getDate() - (29 - index))

    const income = Math.round(760 + Math.sin(index / 4) * 180 + index * 6)
    const expenses = Math.round(520 + Math.cos(index / 5) * 160 + index * 4)

    return {
      date: formatter.format(date),
      income,
      expenses,
    }
  })
}

export default function DashboardPage() {
  const cashFlowData = buildCashFlowData()
  const monthlyIncome = cashFlowData.reduce((sum, item) => sum + item.income, 0)
  const monthlyExpenses = cashFlowData.reduce(
    (sum, item) => sum + item.expenses,
    0
  )

  const totalBalance = 24580.5

  const categoryData = [
    { category: "Housing", value: 3200 },
    { category: "Groceries", value: 1240 },
    { category: "Transportation", value: 640 },
    { category: "Utilities", value: 520 },
    { category: "Subscriptions", value: 310 },
  ]

  const recentTransactions = [
    {
      id: "tx-1",
      category: "Salary",
      description: "Vantage Payroll",
      accountName: "Main Checking",
      date: new Date().toISOString(),
      amount: 5200,
      type: "INCOME",
      icon: "salary",
    },
    {
      id: "tx-2",
      category: "Housing",
      description: "Rent payment",
      accountName: "Main Checking",
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      amount: 1650,
      type: "EXPENSE",
      icon: "home",
    },
    {
      id: "tx-3",
      category: "Groceries",
      description: "Whole Foods",
      accountName: "Cash",
      date: new Date(Date.now() - 86400000 * 4).toISOString(),
      amount: 154.38,
      type: "EXPENSE",
      icon: "groceries",
    },
    {
      id: "tx-4",
      category: "Transportation",
      description: "Metro pass",
      accountName: "Cash",
      date: new Date(Date.now() - 86400000 * 6).toISOString(),
      amount: 62.5,
      type: "EXPENSE",
      icon: "transit",
    },
    {
      id: "tx-5",
      category: "Entertainment",
      description: "Streaming bundle",
      accountName: "Main Checking",
      date: new Date(Date.now() - 86400000 * 7).toISOString(),
      amount: 19.99,
      type: "EXPENSE",
      icon: "misc",
    },
  ] satisfies Array<{
    id: string
    category: string
    description: string
    accountName: string
    date: string
    amount: number
    type: "INCOME" | "EXPENSE"
    icon?: string
  }>

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
    icon?: string
  }>

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
        totalBalance={totalBalance}
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
        currency={currency}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <CashFlowChart data={cashFlowData} />
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
