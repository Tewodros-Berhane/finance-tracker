import { unstable_cache } from "next/cache";
import { differenceInCalendarDays, differenceInCalendarMonths } from "date-fns";
import { Prisma } from "./../../prisma/@/lib/generated/prisma/client";

import { prisma } from "../prisma";
import { convertToBaseCurrency } from "./currency.service";
import { getUserCurrencySettings } from "./user.service";

export type GoalWithAnalytics = {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string | null;
  progressPercent: number;
  daysRemaining: number | null;
  requiredMonthlySaving: string | null;
  financialAccountId: string | null;
  icon: string;
  color: string;
};

const iconPalette = [
  { icon: "trophy", color: "#f59e0b" },
  { icon: "target", color: "#0ea5e9" },
  { icon: "plane", color: "#8b5cf6" },
  { icon: "car", color: "#22c55e" },
  { icon: "home", color: "#f97316" },
];

const selectVisual = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("house") || lower.includes("home")) return iconPalette[4];
  if (lower.includes("car") || lower.includes("auto")) return iconPalette[3];
  if (lower.includes("trip") || lower.includes("flight")) return iconPalette[2];
  if (lower.includes("target") || lower.includes("goal")) return iconPalette[1];
  return iconPalette[0];
};

export async function getGoalsWithAnalytics(
  userId: string
): Promise<GoalWithAnalytics[]> {
  const cacheKey = ["goals", userId];

  const cached = unstable_cache(
    async () => {
      const currencySettings = await getUserCurrencySettings(userId);
      const goals = await prisma.goal.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          targetAmount: true,
          currentAmount: true,
          deadline: true,
          financialAccountId: true,
        },
        orderBy: { name: "asc" },
      });

      return goals.map((goal) => {
        const targetUsd = new Prisma.Decimal(goal.targetAmount);
        const currentUsd = new Prisma.Decimal(goal.currentAmount);
        const progressPercent = targetUsd.isZero()
          ? 0
          : currentUsd.div(targetUsd).times(100).toNumber();
        const deadline = goal.deadline;
        const daysRemaining = deadline
          ? differenceInCalendarDays(deadline, new Date())
          : null;

        const remainingUsd = targetUsd.minus(currentUsd);
        const monthsRemaining =
          deadline && (daysRemaining ?? 0) > 0
            ? Math.max(1, differenceInCalendarMonths(deadline, new Date()))
            : null;

        const requiredMonthlySaving =
          monthsRemaining && remainingUsd.greaterThan(0)
            ? remainingUsd.div(monthsRemaining).toString()
            : null;

        const target = convertToBaseCurrency(
          targetUsd,
          "USD",
          currencySettings
        );
        const current = convertToBaseCurrency(
          currentUsd,
          "USD",
          currencySettings
        );
        const requiredMonthlySavingBase = requiredMonthlySaving
          ? convertToBaseCurrency(
              new Prisma.Decimal(requiredMonthlySaving),
              "USD",
              currencySettings
            ).toString()
          : null;

        const visual = selectVisual(goal.name);

        return {
          id: goal.id,
          name: goal.name,
          targetAmount: target.toString(),
          currentAmount: current.toString(),
          deadline: goal.deadline ? goal.deadline.toISOString() : null,
          progressPercent,
          daysRemaining,
          requiredMonthlySaving: requiredMonthlySavingBase,
          financialAccountId: goal.financialAccountId,
          icon: visual.icon,
          color: visual.color,
        };
      });
    },
    cacheKey,
    { tags: ["goals"] }
  );

  return cached();
}
