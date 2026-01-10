"use server"

import { revalidateTag } from "next/cache"
import { Prisma } from "../generated/prisma/client"
import { z } from "zod"

import { prisma } from "../prisma"
import {
  upsertGoalSchema,
  updateGoalProgressSchema,
} from "./goal.schema"

export type ActionResponse<T> = {
  success: boolean
  data: T | null
  error: string | null
}

export type GoalActionState = ActionResponse<{ id: string }>

export async function upsertGoal(
  state: GoalActionState,
  input: z.infer<typeof upsertGoalSchema>
): Promise<GoalActionState>
export async function upsertGoal(
  input: z.infer<typeof upsertGoalSchema>
): Promise<GoalActionState>
export async function upsertGoal(
  stateOrInput: GoalActionState | z.infer<typeof upsertGoalSchema>,
  maybeInput?: z.infer<typeof upsertGoalSchema>
): Promise<GoalActionState> {
  const payload =
    maybeInput ?? (stateOrInput as z.infer<typeof upsertGoalSchema>)
  const parsed = upsertGoalSchema.safeParse(payload)

  if (!parsed.success) {
    return { success: false, data: null, error: "Invalid goal payload." }
  }

  const data = parsed.data

  if (data.id) {
    const existing = await prisma.goal.findFirst({
      where: { id: data.id, userId: data.userId },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, data: null, error: "Goal not found." }
    }
  }

  const saved = data.id
    ? await prisma.goal.update({
        where: { id: data.id },
        data: {
          name: data.name,
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount ?? "0",
          deadline: data.deadline ?? null,
        },
        select: { id: true },
      })
    : await prisma.goal.create({
        data: {
          userId: data.userId,
          name: data.name,
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount ?? "0",
          deadline: data.deadline ?? null,
        },
        select: { id: true },
      })

  revalidateTag("goals")

  return { success: true, data: { id: saved.id }, error: null }
}

export async function updateGoalProgress(
  state: GoalActionState,
  input: z.infer<typeof updateGoalProgressSchema>
): Promise<GoalActionState>
export async function updateGoalProgress(
  input: z.infer<typeof updateGoalProgressSchema>
): Promise<GoalActionState>
export async function updateGoalProgress(
  stateOrInput: GoalActionState | z.infer<typeof updateGoalProgressSchema>,
  maybeInput?: z.infer<typeof updateGoalProgressSchema>
): Promise<GoalActionState> {
  const payload =
    maybeInput ?? (stateOrInput as z.infer<typeof updateGoalProgressSchema>)
  const parsed = updateGoalProgressSchema.safeParse(payload)

  if (!parsed.success) {
    return { success: false, data: null, error: "Invalid contribution payload." }
  }

  const data = parsed.data

  const existing = await prisma.goal.findFirst({
    where: { id: data.id, userId: data.userId },
    select: { id: true, currentAmount: true },
  })

  if (!existing) {
    return { success: false, data: null, error: "Goal not found." }
  }

  const newAmount = new Prisma.Decimal(existing.currentAmount)
    .plus(new Prisma.Decimal(data.amount))
    .toString()

  const updated = await prisma.goal.updateMany({
    where: { id: data.id, userId: data.userId },
    data: { currentAmount: newAmount },
  })

  if (updated.count === 0) {
    return { success: false, data: null, error: "Unable to update goal." }
  }

  revalidateTag("goals")

  return { success: true, data: { id: data.id }, error: null }
}
