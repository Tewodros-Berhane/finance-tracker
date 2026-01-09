"use server"

import { revalidateTag } from "next/cache"
import { z } from "zod"

import { prisma } from "../prisma"

const accountTypes = ["CHECKING", "SAVINGS", "CREDIT", "CASH", "INVESTMENT"] as const

const createAccountSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(2),
  type: z.enum(accountTypes),
  currency: z.string().min(1),
  initialBalance: z
    .union([z.string(), z.number()])
    .transform((value) =>
      typeof value === "number" ? value.toString() : value.trim()
    )
    .refine((value) => value !== "" && !Number.isNaN(Number(value)), {
      message: "Initial balance must be a number",
    }),
  color: z.string().optional(),
  icon: z.string().optional(),
})

const deleteAccountSchema = z.object({
  userId: z.string().min(1),
  id: z.string().min(1),
})

type ActionResponse<T> = {
  success: boolean
  data: T | null
  error: string | null
}

export async function createAccount(
  input: z.infer<typeof createAccountSchema>
): Promise<ActionResponse<{ id: string }>> {
  const parsed = createAccountSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      data: null,
      error: "Invalid account payload.",
    }
  }

  const data = parsed.data

  const created = await prisma.financialAccount.create({
    data: {
      userId: data.userId,
      name: data.name,
      type: data.type,
      currency: data.currency,
      balance: data.initialBalance,
      color: data.color ?? "#0ea5e9",
      icon: data.icon ?? "wallet",
    },
    select: { id: true },
  })

  revalidateTag("accounts")

  return {
    success: true,
    data: { id: created.id },
    error: null,
  }
}

export async function deleteAccount(
  input: z.infer<typeof deleteAccountSchema>
): Promise<ActionResponse<{ id: string }>> {
  const parsed = deleteAccountSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      data: null,
      error: "Invalid delete payload.",
    }
  }

  const data = parsed.data

  const existing = await prisma.financialAccount.findFirst({
    where: {
      id: data.id,
      userId: data.userId,
    },
    select: { id: true },
  })

  if (!existing) {
    return {
      success: false,
      data: null,
      error: "Account not found.",
    }
  }

  await prisma.financialAccount.deleteMany({
    where: {
      id: data.id,
      userId: data.userId,
    },
  })

  revalidateTag("accounts")

  return {
    success: true,
    data: { id: data.id },
    error: null,
  }
}
