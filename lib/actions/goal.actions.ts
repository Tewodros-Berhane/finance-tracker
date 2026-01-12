"use server"

import { revalidateTag } from "next/cache"
import { Prisma } from "../generated/prisma/client"
import { z } from "zod"

import { getAuthenticatedUser } from "@/lib/services/auth.service"
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

  const user = await getAuthenticatedUser()
  if (!user) {
    return { success: false, data: null, error: "Unauthorized." }
  }

  const data = parsed.data

  if (data.id) {
    const existing = await prisma.goal.findFirst({
      where: { id: data.id, userId: user.id },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, data: null, error: "Goal not found." }
    }
  }

  if (data.financialAccountId) {
    const account = await prisma.financialAccount.findFirst({
      where: { id: data.financialAccountId, userId: user.id },
      select: { id: true },
    })

    if (!account) {
      return { success: false, data: null, error: "Account not found." }
    }
  }

  const currentAmount = new Prisma.Decimal(data.currentAmount ?? "0")

  const saved = data.id
    ? await prisma.goal.update({
        where: { id: data.id },
        data: {
          name: data.name,
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount ?? "0",
          deadline: data.deadline ?? null,
          financialAccountId: data.financialAccountId ?? undefined,
        },
        select: { id: true },
      })
    : await prisma.goal.create({
        data: {
          userId: user.id,
          name: data.name,
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount ?? "0",
          deadline: data.deadline ?? null,
          financialAccountId: data.financialAccountId ?? null,
        },
        select: { id: true },
      })

  if (!data.id && currentAmount.greaterThan(0) && data.financialAccountId) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        financialAccountId: data.financialAccountId,
        categoryId: null,
        type: "TRANSFER",
        amount: currentAmount.mul(-1).toString(),
        date: new Date(),
        description: `Added ${currentAmount.toString()} to goal ${data.name}`,
        isRecurring: false,
      },
      select: { id: true },
    })
  }

  revalidateTag("goals", "max")
  revalidateTag("transactions", "max")
  revalidateTag("summary", "max")
  revalidateTag("accounts", "max")
  if (data.financialAccountId) {
    revalidateTag(`account-${data.financialAccountId}`, "max")
  }

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

  const user = await getAuthenticatedUser()
  if (!user) {
    return { success: false, data: null, error: "Unauthorized." }
  }

  const data = parsed.data

  const existing = await prisma.goal.findFirst({
    where: { id: data.id, userId: user.id },
    select: { id: true, name: true, currentAmount: true },
  })

  if (!existing) {
    return { success: false, data: null, error: "Goal not found." }
  }

  const account = await prisma.financialAccount.findFirst({
    where: { id: data.financialAccountId, userId: user.id },
    select: { id: true },
  })

  if (!account) {
    return { success: false, data: null, error: "Account not found." }
  }

  const contributionAmount = new Prisma.Decimal(data.amount)
  const newAmount = new Prisma.Decimal(existing.currentAmount)
    .plus(contributionAmount)
    .toString()

  const updated = await prisma.goal.updateMany({
    where: { id: data.id, userId: user.id },
    data: { currentAmount: newAmount },
  })

  if (updated.count === 0) {
    return { success: false, data: null, error: "Unable to update goal." }
  }

  await prisma.transaction.create({
    data: {
      userId: user.id,
      financialAccountId: data.financialAccountId,
      categoryId: null,
      type: "TRANSFER",
      amount: contributionAmount.mul(-1).toString(),
      date: new Date(),
      description: `Added ${contributionAmount.toString()} to goal ${existing.name}`,
      isRecurring: false,
    },
    select: { id: true },
  })

  revalidateTag("goals", "max")
  revalidateTag("transactions", "max")
  revalidateTag("summary", "max")
  revalidateTag("accounts", "max")
  revalidateTag(`account-${data.financialAccountId}`, "max")

  return { success: true, data: { id: data.id }, error: null }
}
