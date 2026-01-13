"use client"

import { useMemo, useTransition } from "react"
import {
  Car,
  Home,
  MoreHorizontal,
  Receipt,
  ShoppingBag,
  Tag,
  Utensils,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { deleteBudget } from "@/lib/actions/budget.actions"
import { formatCurrency } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"

type BudgetCardProps = {
  budget: {
    id: string
    categoryId: string
    categoryName: string
    categoryIcon: string
    categoryColor: string
    limit: string
    spent: string
    percentage: number
  }
  currency?: string
}

const iconMap: Record<string, typeof Tag> = {
  shopping: ShoppingBag,
  groceries: ShoppingBag,
  food: Utensils,
  dining: Utensils,
  rent: Home,
  housing: Home,
  home: Home,
  transport: Car,
  transit: Car,
  travel: Car,
  cash: Wallet,
  misc: Receipt,
  uncategorized: Receipt,
  tag: Tag,
}

export function BudgetCard({ budget, currency = "USD" }: BudgetCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const spentValue = Number(budget.spent)
  const limitValue = Number(budget.limit)
  const percentValue = Number.isFinite(budget.percentage)
    ? Math.min(100, Math.max(0, budget.percentage))
    : 0
  const isOver = spentValue > limitValue

  const indicatorClass = useMemo(() => {
    if (percentValue >= 100) {
      return "[&_[data-slot=progress-indicator]]:bg-rose-500"
    }
    if (percentValue >= 80) {
      return "[&_[data-slot=progress-indicator]]:bg-amber-500"
    }
    return "[&_[data-slot=progress-indicator]]:bg-emerald-500"
  }, [percentValue])

  const categoryKey = budget.categoryIcon?.toLowerCase() ??
    budget.categoryName.toLowerCase()
  const Icon = iconMap[categoryKey] ?? Tag

  const remaining = limitValue - spentValue

  const handleDelete = () => {
    startTransition(async () => {
      const response = await deleteBudget({ id: budget.id })

      if (!response.success) {
        toast.error(response.error ?? "Failed to delete budget.")
        return
      }

      toast.success("Budget deleted.")
      router.refresh()
    })
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="flex items-center gap-3">
          <span
            className="rounded-full bg-muted/60 p-2"
            style={{ color: budget.categoryColor }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{budget.categoryName}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(spentValue, currency, {
                maximumFractionDigits: 2,
              })}{" "}
              /{" "}
              {formatCurrency(limitValue, currency, {
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isPending}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{Math.round(percentValue)}% used</span>
          {isOver && <Badge variant="destructive">Warning</Badge>}
        </div>
        <Progress
          value={percentValue}
          className={`h-2.5 [&_[data-slot=progress-indicator]]:transition-all [&_[data-slot=progress-indicator]]:duration-700 ${indicatorClass}`}
        />
        <p className="text-xs text-muted-foreground">
          {remaining >= 0
            ? `You have ${formatCurrency(remaining, currency, {
                maximumFractionDigits: 2,
              })} remaining this month.`
            : `Over by ${formatCurrency(Math.abs(remaining), currency, {
                maximumFractionDigits: 2,
              })} this month.`}
        </p>
      </CardContent>
    </Card>
  )
}
