"use client"

import { useTransition } from "react"
import {
  Car,
  Home,
  MoreHorizontal,
  Receipt,
  ShoppingBag,
  Tag,
  TrainFront,
  Utensils,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { deleteCategory } from "@/lib/actions/category.actions"
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
import { CategoryForm } from "./category-form"

type CategoryCardProps = {
  category: {
    id: string
    name: string
    type: "INCOME" | "EXPENSE"
    color: string
    icon: string
    transactionCount: number
    monthlySpend: string
  }
  currency?: string
}

const iconMap: Record<string, typeof Tag> = {
  shopping: ShoppingBag,
  groceries: ShoppingBag,
  food: Utensils,
  dining: Utensils,
  car: Car,
  transport: TrainFront,
  travel: TrainFront,
  rent: Home,
  home: Home,
  wallet: Wallet,
  receipt: Receipt,
  tag: Tag,
}

export function CategoryCard({
  category,
  currency = "USD",
}: CategoryCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const iconKey = category.icon?.toLowerCase() ?? "tag"
  const Icon = iconMap[iconKey] ?? Tag
  const monthlySpend = Number(category.monthlySpend)

  const handleDelete = () => {
    startTransition(async () => {
      const response = await deleteCategory({ id: category.id })

      if (!response.success) {
        toast.error(response.error ?? "Failed to delete category.")
        return
      }

      toast.success("Category deleted.")
      router.refresh()
    })
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="rounded-full p-2 text-white"
            style={{ backgroundColor: category.color }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{category.name}</p>
            <Badge variant="outline">
              {category.type === "INCOME" ? "Income" : "Expense"}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <CategoryForm
              initialData={{
                id: category.id,
                name: category.name,
                type: category.type,
                icon: category.icon,
                color: category.color,
              }}
              trigger={<DropdownMenuItem>Edit</DropdownMenuItem>}
            />
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
      <CardContent className="flex flex-1 flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {category.transactionCount}{" "}
          {category.transactionCount === 1 ? "transaction" : "transactions"}
        </p>
        <p className="text-sm font-medium">
          {formatCurrency(monthlySpend, currency, {
            maximumFractionDigits: 2,
          })}{" "}
          spent this month
        </p>
      </CardContent>
    </Card>
  )
}
