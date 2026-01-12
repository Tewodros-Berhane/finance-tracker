"use client"

import Link from "next/link"
import {
  CarFront,
  Home,
  Receipt,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const iconMap = {
  shopping: ShoppingBag,
  dining: UtensilsCrossed,
  housing: Home,
  transport: CarFront,
  misc: Receipt,
} as const

type IconKey = keyof typeof iconMap
export type BudgetIconKey = IconKey

type BudgetItem = {
  id: string
  category: string
  spent: number
  limit: number
  icon?: IconKey
}

type DashboardBudgetsProps = {
  data: BudgetItem[]
  currency?: string
}

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)

export function DashboardBudgets({
  data,
  currency = "USD",
}: DashboardBudgetsProps) {
  const sortedBudgets = [...data]
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit)
    .slice(0, 3)

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Budgets</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/budgets">View All</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {sortedBudgets.map((budget) => {
          const Icon = (budget.icon && iconMap[budget.icon]) || Receipt
          const percent = Math.round((budget.spent / budget.limit) * 100)
          const progressClass = cn(
            "bg-muted h-2",
            percent >= 100
              ? "[&_[data-slot=progress-indicator]]:bg-rose-500"
              : percent >= 80
                ? "[&_[data-slot=progress-indicator]]:bg-amber-500"
                : "[&_[data-slot=progress-indicator]]:bg-emerald-500"
          )

          return (
            <div key={budget.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <span className="bg-muted flex size-8 items-center justify-center rounded-full">
                    <Icon className="size-4" />
                  </span>
                  <span>{budget.category}</span>
                </div>
                <span className="text-muted-foreground text-xs">
                  {formatCurrency(budget.spent, currency)} /{" "}
                  {formatCurrency(budget.limit, currency)}
                </span>
              </div>
              <Progress
                value={Math.min(percent, 100)}
                className={progressClass}
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
