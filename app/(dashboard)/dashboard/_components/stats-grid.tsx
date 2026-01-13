"use client"

import { TrendingDown, TrendingUp, Wallet } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"

type StatsGridProps = {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  currency?: string
}

export function StatsGrid({
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  currency = "USD",
}: StatsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-muted-foreground text-sm">
            Total Balance
          </CardTitle>
          <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full">
            <Wallet className="size-4" />
          </span>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">
            {formatCurrency(totalBalance, currency, {
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-muted-foreground text-xs">
            Across all connected accounts
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-muted-foreground text-sm">
            Monthly Income
          </CardTitle>
          <span className="bg-emerald-500/10 text-emerald-500 flex size-9 items-center justify-center rounded-full">
            <TrendingUp className="size-4" />
          </span>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">
            {formatCurrency(monthlyIncome, currency, {
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-muted-foreground text-xs">
            Incoming transactions this month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-muted-foreground text-sm">
            Monthly Expenses
          </CardTitle>
          <span className="bg-rose-500/10 text-rose-500 flex size-9 items-center justify-center rounded-full">
            <TrendingDown className="size-4" />
          </span>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">
            {formatCurrency(monthlyExpenses, currency, {
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-muted-foreground text-xs">
            Outgoing transactions this month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
