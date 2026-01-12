"use client"

import {
  Car,
  Home,
  Plane,
  Target,
  Trophy,
  Wallet,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

import { ContributionModal } from "./contribution-modal"

type GoalCardProps = {
  goal: {
    id: string
    name: string
    targetAmount: string
    currentAmount: string
    deadline: string | null
    progressPercent: number
    daysRemaining: number | null
    requiredMonthlySaving: string | null
    financialAccountId?: string | null
    icon: string
    color: string
  }
  currency?: string
}

const iconMap: Record<string, typeof Trophy> = {
  trophy: Trophy,
  target: Target,
  plane: Plane,
  car: Car,
  home: Home,
  wallet: Wallet,
}

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value)

export function GoalCard({ goal, currency = "USD" }: GoalCardProps) {
  const current = Number(goal.currentAmount)
  const target = Number(goal.targetAmount)
  const progress = Math.min(100, Math.max(0, goal.progressPercent))
  const achieved = current >= target && target > 0
  const behind = !achieved && goal.daysRemaining !== null && goal.daysRemaining < 0

  const statusLabel = achieved
    ? "Achieved"
    : behind
      ? "Behind"
      : "On Track"

  const statusVariant = achieved
    ? "default"
    : behind
      ? "destructive"
      : "secondary"

  const Icon = iconMap[goal.icon] ?? Target

  return (
    <Card className="border-border/60 bg-background/70 backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="flex items-center gap-3">
          <span
            className="rounded-full p-2 text-white"
            style={{ backgroundColor: goal.color }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{goal.name}</p>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
        </div>
        <ContributionModal
          goalId={goal.id}
          defaultAccountId={goal.financialAccountId}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Progress
          value={progress}
          className={cn(
            "h-3 [&_[data-slot=progress-indicator]]:transition-all [&_[data-slot=progress-indicator]]:duration-700",
            achieved && "[&_[data-slot=progress-indicator]]:bg-emerald-500",
            behind && "[&_[data-slot=progress-indicator]]:bg-rose-500"
          )}
        />
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Amount saved</p>
            <p className="font-medium">
              {formatCurrency(current, currency)} /{" "}
              {formatCurrency(target, currency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Days left</p>
            <p className="font-medium">
              {goal.daysRemaining === null
                ? "No deadline"
                : Math.max(goal.daysRemaining, 0)}
            </p>
          </div>
        </div>
        {goal.requiredMonthlySaving && !achieved && (
          <p className="text-xs text-muted-foreground">
            Save{" "}
            {formatCurrency(Number(goal.requiredMonthlySaving), currency)}/mo to
            reach this.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
