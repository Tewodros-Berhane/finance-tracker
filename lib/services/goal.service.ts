import { unstable_cache } from "next/cache"
import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
} from "date-fns"
import { Prisma } from "../generated/prisma/client"

import { prisma } from "../prisma"

export type GoalWithAnalytics = {
  id: string
  name: string
  targetAmount: string
  currentAmount: string
  deadline: string | null
  progressPercent: number
  daysRemaining: number | null
  requiredMonthlySaving: string | null
  icon: string
  color: string
}

const iconPalette = [
  { icon: "trophy", color: "#f59e0b" },
  { icon: "target", color: "#0ea5e9" },
  { icon: "plane", color: "#8b5cf6" },
  { icon: "car", color: "#22c55e" },
  { icon: "home", color: "#f97316" },
]

const selectVisual = (name: string) => {
  const lower = name.toLowerCase()
  if (lower.includes("house") || lower.includes("home")) return iconPalette[4]
  if (lower.includes("car") || lower.includes("auto")) return iconPalette[3]
  if (lower.includes("trip") || lower.includes("flight")) return iconPalette[2]
  if (lower.includes("target") || lower.includes("goal")) return iconPalette[1]
  return iconPalette[0]
}

export async function getGoalsWithAnalytics(
  userId: string
): Promise<GoalWithAnalytics[]> {
  const cacheKey = ["goals", userId]

  const cached = unstable_cache(
    async () => {
      const goals = await prisma.goal.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          targetAmount: true,
          currentAmount: true,
          deadline: true,
        },
        orderBy: { name: "asc" },
      })

      return goals.map((goal) => {
        const target = new Prisma.Decimal(goal.targetAmount)
        const current = new Prisma.Decimal(goal.currentAmount)
        const progressPercent = target.isZero()
          ? 0
          : current.div(target).times(100).toNumber()
        const deadline = goal.deadline
        const daysRemaining = deadline
          ? differenceInCalendarDays(deadline, new Date())
          : null

        const remaining = target.minus(current)
        const monthsRemaining =
          deadline && (daysRemaining ?? 0) > 0
            ? Math.max(1, differenceInCalendarMonths(deadline, new Date()))
            : null

        const requiredMonthlySaving =
          monthsRemaining && remaining.greaterThan(0)
            ? remaining.div(monthsRemaining).toString()
            : null

        const visual = selectVisual(goal.name)

        return {
          id: goal.id,
          name: goal.name,
          targetAmount: target.toString(),
          currentAmount: current.toString(),
          deadline: goal.deadline ? goal.deadline.toISOString() : null,
          progressPercent,
          daysRemaining,
          requiredMonthlySaving,
          icon: visual.icon,
          color: visual.color,
        }
      })
    },
    cacheKey,
    { tags: ["goals"] }
  )

  return cached()
}
