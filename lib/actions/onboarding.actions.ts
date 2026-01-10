"use server"

import { revalidateTag } from "next/cache"
import { z } from "zod"

import { prisma } from "../prisma"
import { onboardingSchema } from "@/app/onboarding/schema"

const onboardingActionSchema = onboardingSchema.extend({
  userId: z.string().min(1),
})

export type ActionResponse<T> = {
  success: boolean
  data: T | null
  error: string | null
}

export type OnboardingActionState = ActionResponse<{ id: string }>

export async function createOnboardingAccount(
  state: OnboardingActionState,
  input: z.infer<typeof onboardingActionSchema>
): Promise<OnboardingActionState>
export async function createOnboardingAccount(
  input: z.infer<typeof onboardingActionSchema>
): Promise<OnboardingActionState>
export async function createOnboardingAccount(
  stateOrInput:
    | OnboardingActionState
    | z.infer<typeof onboardingActionSchema>,
  maybeInput?: z.infer<typeof onboardingActionSchema>
): Promise<OnboardingActionState> {
  const payload =
    maybeInput ?? (stateOrInput as z.infer<typeof onboardingActionSchema>)
  const parsed = onboardingActionSchema.safeParse(payload)

  if (!parsed.success) {
    return { success: false, data: null, error: "Invalid account payload." }
  }

  const data = parsed.data

  const created = await prisma.financialAccount.create({
    data: {
      userId: data.userId,
      name: data.name,
      type: data.type,
      balance: data.balance,
      currency: data.currency,
      color: "#0ea5e9",
      icon: "wallet",
    },
    select: { id: true },
  })

  revalidateTag("accounts")
  revalidateTag("summary")

  return { success: true, data: { id: created.id }, error: null }
}
