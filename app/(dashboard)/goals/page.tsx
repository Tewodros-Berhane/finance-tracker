import { Prisma } from "@/lib/generated/prisma/client"
import { getGoalsWithAnalytics } from "@/lib/services/goal.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PiggyBank } from "lucide-react"

import { GoalForm } from "./_components/goal-form"
import { GoalCard } from "./_components/goal-card"

export default async function GoalsPage() {
  const userId = "demo-user"
  const goals = await getGoalsWithAnalytics(userId)

  const totalSavings = goals.reduce(
    (total, goal) => total.plus(new Prisma.Decimal(goal.currentAmount)),
    new Prisma.Decimal(0)
  )

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
          <p className="text-muted-foreground text-sm">
            Track every milestone on your savings journey.
          </p>
        </div>
        <GoalForm userId={userId} trigger={<Button size="sm">New Goal</Button>} />
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Total Savings
            </p>
            <p className="text-2xl font-semibold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 2,
              }).format(Number(totalSavings))}
            </p>
          </div>
          <span className="bg-muted flex size-12 items-center justify-center rounded-full">
            <PiggyBank className="h-5 w-5 text-muted-foreground" />
          </span>
        </CardContent>
      </Card>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <span className="bg-muted flex size-12 items-center justify-center rounded-full">
              <PiggyBank className="h-5 w-5 text-muted-foreground" />
            </span>
            <div className="space-y-1">
              <p className="text-base font-medium">No goals found</p>
              <p className="text-sm text-muted-foreground">
                Start saving for your next big milestone.
              </p>
            </div>
            <GoalForm
              userId={userId}
              trigger={<Button variant="outline">Start Saving</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} userId={userId} />
          ))}
        </div>
      )}
    </div>
  )
}
