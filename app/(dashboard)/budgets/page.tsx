import { Suspense } from "react"
import { redirect } from "next/navigation"

import { Prisma } from "@/lib/generated/prisma/client"
import { getAuthenticatedUser } from "@/lib/services/auth.service"
import { getBudgetsWithProgress } from "@/lib/services/budget.service"
import { getUserCurrencySettings } from "@/lib/services/user.service"
import { prisma } from "@/lib/prisma"
import { createMetadata } from "@/lib/seo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Wallet } from "lucide-react"

import { AddBudgetModal } from "./_components/add-budget-modal"
import { BudgetCard } from "./_components/budget-card"
import { BudgetStats } from "./_components/budget-stats"

export const metadata = createMetadata({
  title: "Budgets",
  description: "Set monthly limits and track spending by category.",
  canonical: "/budgets",
})

function BudgetsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  )
}

async function BudgetsContent() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect("/sign-in")
  }

  const [budgets, categories, currencySettings] = await Promise.all([
    getBudgetsWithProgress(user.id),
    prisma.category.findMany({
      where: { userId: user.id, type: "EXPENSE" },
      select: {
        id: true,
        name: true,
        icon: true,
      },
      orderBy: { name: "asc" },
    }),
    getUserCurrencySettings(user.id),
  ])

  const totalBudgeted = budgets.reduce(
    (total, budget) => total.plus(new Prisma.Decimal(budget.limit)),
    new Prisma.Decimal(0)
  )
  const totalSpent = budgets.reduce(
    (total, budget) => total.plus(new Prisma.Decimal(budget.spent)),
    new Prisma.Decimal(0)
  )

  const overBudgetCount = budgets.filter(
    (budget) => Number(budget.spent) > Number(budget.limit)
  ).length

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground text-sm">
            Stay on track with monthly limits for every category.
          </p>
        </div>
        <AddBudgetModal
          categories={categories}
          trigger={<Button size="sm">Add Budget</Button>}
        />
      </header>

      {budgets.length > 0 && (
        <BudgetStats
          totalBudgeted={totalBudgeted.toString()}
          totalSpent={totalSpent.toString()}
          currency={currencySettings.baseCurrency}
        />
      )}

      {overBudgetCount > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Budget warning</AlertTitle>
          <AlertDescription>
            {overBudgetCount} {overBudgetCount === 1 ? "category is" : "categories are"} over budget this month.
          </AlertDescription>
        </Alert>
      )}

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <span className="bg-muted flex size-12 items-center justify-center rounded-full">
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </span>
            <div className="space-y-1">
              <p className="text-base font-medium">Set your first budget</p>
              <p className="text-sm text-muted-foreground">
                Create spending limits to stay in control this month.
              </p>
            </div>
            <AddBudgetModal
              categories={categories}
              trigger={<Button variant="outline">Create Budget</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                currency={currencySettings.baseCurrency}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

export default function BudgetsPage() {
  return (
    <Suspense fallback={<BudgetsSkeleton />}>
      <BudgetsContent />
    </Suspense>
  )
}
