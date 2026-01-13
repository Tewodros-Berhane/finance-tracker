"use client"

import {
  Banknote,
  Home,
  Receipt,
  ShoppingBasket,
  TrainFront,
  Utensils,
  Wallet,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER"

type RecentTransaction = {
  id: string
  category: string
  description: string
  accountName: string
  date: string
  amount: number
  type: TransactionType
  icon?: string
  currency: string
}

const iconMap = {
  salary: Banknote,
  income: Banknote,
  rent: Home,
  housing: Home,
  home: Home,
  groceries: ShoppingBasket,
  food: Utensils,
  dining: Utensils,
  transit: TrainFront,
  transport: TrainFront,
  travel: TrainFront,
  cash: Wallet,
  misc: Receipt,
  uncategorized: Receipt,
} satisfies Record<string, typeof Banknote>

type RecentTransactionsProps = {
  data: RecentTransaction[]
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value))

export function RecentTransactions({ data }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">
          Recent transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((transaction) => {
          const iconKey =
            transaction.icon?.toLowerCase() ??
            transaction.category.toLowerCase()
          const hasIcon = Object.prototype.hasOwnProperty.call(iconMap, iconKey)
          const Icon = hasIcon
            ? iconMap[iconKey as keyof typeof iconMap]
            : Receipt
          const isIncome = transaction.type === "INCOME"
          const isExpense = transaction.type === "EXPENSE"

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
                  isIncome && "text-emerald-500",
                  isExpense && "text-rose-500",
                  transaction.type === "TRANSFER" && "text-muted-foreground"
                )}
              >
                {isIncome ? "+" : isExpense ? "-" : ""}
                {formatCurrency(
                  Math.abs(transaction.amount),
                  transaction.currency,
                  { maximumFractionDigits: 2 }
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
