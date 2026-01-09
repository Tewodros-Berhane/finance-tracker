"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import {
  CreditCard,
  Landmark,
  MoreHorizontal,
  PiggyBank,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"
import type { AccountType } from "@/lib/generated/prisma/client"
import { deleteAccount } from "@/lib/actions/account.actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const typeLabels: Record<AccountType, string> = {
  CHECKING: "Checking",
  SAVINGS: "Savings",
  CREDIT: "Credit",
  CASH: "Cash",
  INVESTMENT: "Investment",
}

const typeIcons: Record<AccountType, typeof Wallet> = {
  CHECKING: Landmark,
  SAVINGS: PiggyBank,
  CREDIT: CreditCard,
  CASH: Wallet,
  INVESTMENT: Landmark,
}

type AccountCardProps = {
  account: {
    id: string
    name: string
    type: AccountType
    currency: string
    color: string
    icon: string
    currentBalance: string
  }
  userId: string
}

const formatCurrency = (value: string, currency: string) => {
  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) return value

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(numericValue)
}

export function AccountCard({ account, userId }: AccountCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const Icon = typeIcons[account.type] ?? Wallet
  const balanceValue = Number(account.currentBalance)
  const balanceColor =
    account.type === "CREDIT" && balanceValue > 0
      ? "text-destructive"
      : "text-foreground"

  const handleDelete = () => {
    startTransition(async () => {
      const response = await deleteAccount({ userId, id: account.id })

      if (!response.success) {
        toast.error(response.error ?? "Failed to delete account.")
        return
      }

      toast.success("Account deleted.")
      router.refresh()
    })
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="rounded-full bg-muted/60 p-2"
            style={{ color: account.color }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="space-y-1">
            <CardTitle className="text-base">{account.name}</CardTitle>
            <Badge variant="outline">{typeLabels[account.type]}</Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isPending}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/transactions?accountId=${account.id}`}>
                View Transactions
              </Link>
            </DropdownMenuItem>
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
      <CardContent className="flex flex-col gap-2">
        <div className={`text-2xl font-semibold ${balanceColor}`}>
          {formatCurrency(account.currentBalance, account.currency)}
        </div>
        <p className="text-sm text-muted-foreground">{account.currency}</p>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button asChild variant="ghost" size="sm" className="px-0">
          <Link href={`/transactions?accountId=${account.id}`}>
            View Transactions
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
