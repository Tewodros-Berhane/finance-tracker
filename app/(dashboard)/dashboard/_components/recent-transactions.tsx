"use client"

import {
  Banknote,
  Home,
  Receipt,
  ShoppingBasket,
  TrainFront,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type TransactionType = "INCOME" | "EXPENSE"

type RecentTransaction = {
  id: string
  category: string
  description: string
  accountName: string
  date: string
  amount: number
  type: TransactionType
  icon?: string
}

const iconMap = {
  salary: Banknote,
  home: Home,
  groceries: ShoppingBasket,
  transit: TrainFront,
  misc: Receipt,
} satisfies Record<string, typeof Banknote>

type RecentTransactionsProps = {
  data: RecentTransaction[]
  currency?: string
}

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value))

export function RecentTransactions({
  data,
  currency = "USD",
}: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">
          Recent transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((transaction) => {
          const Icon =
            (transaction.icon && iconMap[transaction.icon]) || Receipt
          const isIncome = transaction.type === "INCOME"

          return (
            <div
              key={transaction.id}
              className="flex items-start justify-between gap-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="bg-muted flex size-10 items-center justify-center rounded-full">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {transaction.description}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {transaction.category} - {formatDate(transaction.date)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {transaction.accountName}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "shrink-0 text-sm font-semibold tabular-nums",
                  isIncome ? "text-emerald-500" : "text-rose-500"
                )}
              >
                {isIncome ? "+" : "-"}
                {formatCurrency(Math.abs(transaction.amount), currency)}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

