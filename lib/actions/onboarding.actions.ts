"use server"

import { revalidateTag } from "next/cache"
import { z } from "zod"

import { getAuthenticatedUser } from "@/lib/services/auth.service"
import { prisma } from "../prisma"
import { onboardingSchema } from "./onboarding.schema"

export type ActionResponse<T> = {
  success: boolean
  data: T | null
  error: string | null
}

export type OnboardingActionState = ActionResponse<{ id: string }>

export async function createOnboardingAccount(
  state: OnboardingActionState,
  input: z.infer<typeof onboardingSchema>
): Promise<OnboardingActionState>
export async function createOnboardingAccount(
  input: z.infer<typeof onboardingSchema>
): Promise<OnboardingActionState>
export async function createOnboardingAccount(
  stateOrInput:
    | OnboardingActionState
    | z.infer<typeof onboardingSchema>,
  maybeInput?: z.infer<typeof onboardingSchema>
): Promise<OnboardingActionState> {
  const payload =
    maybeInput ?? (stateOrInput as z.infer<typeof onboardingSchema>)
  const parsed = onboardingSchema.safeParse(payload)

  if (!parsed.success) {
    return { success: false, data: null, error: "Invalid account payload." }
  }

  const user = await getAuthenticatedUser()
  if (!user) {
    return { success: false, data: null, error: "Unauthorized." }
  }

  const data = parsed.data

  const created = await prisma.financialAccount.create({
    data: {
      userId: user.id,
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
