"use client"

import { useMemo, useState } from "react"
import {
  Car,
  Home,
  Loader2,
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
import { AddBudgetModal } from "./add-budget-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  categories: {
    id: string
    name: string
    icon?: string | null
  }[]
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

export function BudgetCard({ budget, categories, currency = "USD" }: BudgetCardProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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

  const confirmDelete = async () => {
    setIsDeleting(true)
    const response = await deleteBudget({ id: budget.id })
    setIsDeleting(false)

    if (!response.success) {
      toast.error(response.error ?? "Failed to delete budget.")
      return
    }

    toast.success("Budget deleted.")
    setDeleteOpen(false)
    router.refresh()
  }

  const handleDeleteOpenChange = (open: boolean) => {
    if (isDeleting) return
    setDeleteOpen(open)
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
            <Button variant="ghost" size="icon" disabled={isDeleting}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setDeleteOpen(true)}
              disabled={isDeleting}
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
      <AddBudgetModal
        categories={categories}
        budget={{
          categoryId: budget.categoryId,
          amount: budget.limit,
        }}
        open={editOpen}
        onOpenChange={setEditOpen}
        showTrigger={false}
      />
      <AlertDialog open={deleteOpen} onOpenChange={handleDeleteOpenChange}>
        <AlertDialogContent className="border-destructive">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete budget?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the budget for this category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
