"use client"

import { format } from "date-fns"
import {
  ArrowUpDown,
  Home,
  MoreHorizontal,
  Pencil,
  Receipt,
  ShoppingBag,
  Tag,
  Trash2,
  Utensils,
  UtensilsCrossed,
  Wallet,
} from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

export type TransactionRow = {
  id: string
  date: string
  description: string
  categoryId: string
  categoryName: string
  categoryColor?: string | null
  categoryIcon?: string | null
  accountId: string
  accountName: string
  accountCurrency?: string | null
  type: "INCOME" | "EXPENSE" | "TRANSFER"
  amount: string
}

const categoryIconMap = {
  shopping: ShoppingBag,
  groceries: ShoppingBag,
  food: Utensils,
  dining: UtensilsCrossed,
  rent: Home,
  housing: Home,
  home: Home,
  receipt: Receipt,
  tag: Tag,
  wallet: Wallet,
} satisfies Record<string, typeof Tag>

export const columns: ColumnDef<TransactionRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 gap-2"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Date
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue<string>("date")
      return (
        <span className="text-sm">
          {format(new Date(date), "MMM dd, yyyy")}
        </span>
      )
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    filterFn: "includesString",
    cell: ({ row }) => (
      <div className="min-w-0 max-w-[220px]">
        <p className="text-sm font-medium truncate">
          {row.getValue("description")}
        </p>
        <p className="text-muted-foreground text-xs truncate">
          {row.original.accountName}
        </p>
      </div>
    ),
    meta: {
      className: "w-[240px] max-w-[240px]",
    },
  },
  {
    accessorKey: "categoryName",
    header: "Category",
    filterFn: (row, id, value) => {
      return (value as string[]).includes(row.original.categoryId)
    },
    cell: ({ row }) => {
      const color = row.original.categoryColor ?? undefined
      const iconKey =
        (row.original.categoryIcon ?? row.original.categoryName).toLowerCase()
      const hasIcon = Object.prototype.hasOwnProperty.call(
        categoryIconMap,
        iconKey
      )
      const Icon = hasIcon
        ? categoryIconMap[iconKey as keyof typeof categoryIconMap]
        : Tag

      return (
        <Badge
          variant="outline"
          className="gap-1"
          style={color ? { borderColor: color, color } : undefined}
        >
          <Icon className="size-3" />
          {row.original.categoryName}
        </Badge>
      )
    },
  },
  {
    accessorKey: "accountName",
    header: "Account",
    filterFn: (row, id, value) => {
      return (value as string[]).includes(row.original.accountId)
    },
    cell: ({ row }) => (
      <Badge variant="secondary" className="text-muted-foreground">
        {row.getValue("accountName")}
      </Badge>
    ),
    meta: {
      className: "hidden md:table-cell",
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    filterFn: (row, id, value) => {
      return (value as string[]).includes(row.getValue(id))
    },
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">
        {row.getValue("type")}
      </span>
    ),
    meta: {
      className: "hidden lg:table-cell",
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const type = row.original.type
      const currency = row.original.accountCurrency ?? "USD"
      const formatted = formatCurrency(row.original.amount, currency, {
        maximumFractionDigits: 2,
      })

      return (
        <div
          className={cn(
            "text-right text-sm font-semibold tabular-nums",
            type === "INCOME" && "text-emerald-500",
            type === "EXPENSE" && "text-rose-500"
          )}
        >
          {type === "INCOME" ? "+" : type === "EXPENSE" ? "-" : ""}
          {formatted}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive">
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]
