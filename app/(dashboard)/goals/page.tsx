import { Suspense } from "react";
import { redirect } from "next/navigation";

import { Prisma } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/services/auth.service";
import { getGoalsWithAnalytics } from "@/lib/services/goal.service";
import { getUserCurrencySettings } from "@/lib/services/user.service";
import { formatCurrency } from "@/lib/format";
import { createMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PiggyBank } from "lucide-react";

import { GoalForm } from "./_components/goal-form";
import { GoalCard } from "./_components/goal-card";

export const metadata = createMetadata({
  title: "Goals",
  description: "Track savings goals and contributions over time.",
  canonical: "/goals",
});

function GoalsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
    </div>
  );
}

async function GoalsContent() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/sign-in");
  }

  const [goals, currencySettings] = await Promise.all([
    getGoalsWithAnalytics(user.id),
    getUserCurrencySettings(user.id),
  ]);

  const totalSavings = goals.reduce(
    (total, goal) => total.plus(new Prisma.Decimal(goal.currentAmount)),
    new Prisma.Decimal(0)
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
          <p className="text-muted-foreground text-sm">
            Track every milestone on your savings journey.
          </p>
        </div>
        <GoalForm trigger={<Button size="sm">New Goal</Button>} />
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Total Savings
            </p>
            <p className="text-2xl font-semibold">
              {formatCurrency(
                Number(totalSavings),
                currencySettings.baseCurrency,
                { maximumFractionDigits: 2 }
              )}
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
              trigger={<Button variant="outline">Start Saving</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              currency={currencySettings.baseCurrency}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<GoalsSkeleton />}>
      <GoalsContent />
    </Suspense>
  );
}
