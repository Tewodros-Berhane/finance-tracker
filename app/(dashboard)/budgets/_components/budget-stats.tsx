import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"

type BudgetStatsProps = {
  totalBudgeted: string
  totalSpent: string
  currency?: string
}

export function BudgetStats({
  totalBudgeted,
  totalSpent,
  currency = "USD",
}: BudgetStatsProps) {
  const budgetedValue = Number(totalBudgeted)
  const spentValue = Number(totalSpent)
  const isOver = spentValue > budgetedValue

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            Total Budgeted
          </p>
          <p className="text-2xl font-semibold">
            {formatCurrency(budgetedValue, currency, {
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
          <div className="flex items-center gap-2">
            {isOver ? (
              <ArrowUpRight className="h-4 w-4 text-rose-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-emerald-500" />
            )}
            <p className="text-2xl font-semibold">
              {formatCurrency(spentValue, currency, {
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {isOver
            ? "You are over budget this month."
            : "You are tracking within budget."}
        </div>
      </CardContent>
    </Card>
  )
}
