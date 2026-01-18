"use client"

import { useState } from "react"
import {
  Car,
  Home,
  Loader2,
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
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const iconKey = category.icon?.toLowerCase() ?? "tag"
  const Icon = iconMap[iconKey] ?? Tag
  const monthlySpend = Number(category.monthlySpend)

  const confirmDelete = async () => {
    setIsDeleting(true)
    const response = await deleteCategory({ id: category.id })
    setIsDeleting(false)

    if (!response.success) {
      toast.error(response.error ?? "Failed to delete category.")
      return
    }

    toast.success("Category deleted.")
    setDeleteOpen(false)
    router.refresh()
  }

  const handleDeleteOpenChange = (open: boolean) => {
    if (isDeleting) return
    setDeleteOpen(open)
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
      <CategoryForm
        initialData={{
          id: category.id,
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color,
        }}
        open={editOpen}
        onOpenChange={setEditOpen}
        showTrigger={false}
      />
      <AlertDialog open={deleteOpen} onOpenChange={handleDeleteOpenChange}>
        <AlertDialogContent className="border-destructive">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move related transactions into Uncategorized.
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
