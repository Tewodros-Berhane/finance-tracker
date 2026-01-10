"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { z } from "zod"

import { prisma } from "../prisma"
import { createTransactionSchema } from "./transaction.schema"
// export { createTransactionSchema } from "./transaction.schema"

const deleteTransactionSchema = z.object({
  userId: z.string().min(1),
  id: z.string().min(1),
})

export type ActionResponse<T> = {
  success: boolean
  data: T | null
  error: string | null
}

export type TransactionActionState = ActionResponse<{ id: string }>

export async function createTransaction(
  state: TransactionActionState,
  input: z.infer<typeof createTransactionSchema>
): Promise<TransactionActionState>
export async function createTransaction(
  input: z.infer<typeof createTransactionSchema>
): Promise<TransactionActionState>
export async function createTransaction(
  stateOrInput: TransactionActionState | z.infer<typeof createTransactionSchema>,
  maybeInput?: z.infer<typeof createTransactionSchema>
): Promise<TransactionActionState> {
  const payload =
    maybeInput ?? (stateOrInput as z.infer<typeof createTransactionSchema>)
  const parsed = createTransactionSchema.safeParse(payload)

  if (!parsed.success) {
    return {
      success: false,
      data: null,
      error: "Invalid transaction payload.",
    }
  }

  const data = parsed.data

  const account = await prisma.financialAccount.findFirst({
    where: {
      id: data.financialAccountId,
      userId: data.userId,
    },
    select: { id: true },
  })

  if (!account) {
    return {
      success: false,
      data: null,
      error: "Account not found.",
    }
  }

  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        userId: data.userId,
      },
      select: { id: true },
    })

    if (!category) {
      return {
        success: false,
        data: null,
        error: "Category not found.",
      }
    }
  }

  const created = await prisma.transaction.create({
    data: {
      userId: data.userId,
      financialAccountId: data.financialAccountId,
      categoryId: data.categoryId ?? null,
      type: data.type,
      amount: data.amount,
      date: data.date,
      description: data.description ?? null,
      isRecurring: data.isRecurring,
    },
    select: { id: true },
  })

  revalidateTag("transactions", "default")
  revalidateTag("summary", "default")
  revalidateTag(`account-${data.financialAccountId}`, "default")
  revalidatePath("/transactions")

  return {
    success: true,
    data: { id: created.id },
    error: null,
  }
}

export async function deleteTransaction(
  input: z.infer<typeof deleteTransactionSchema>
): Promise<ActionResponse<{ id: string }>> {
  const parsed = deleteTransactionSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      data: null,
      error: "Invalid delete payload.",
    }
  }

  const data = parsed.data

  const existing = await prisma.transaction.findFirst({
    where: {
      id: data.id,
      userId: data.userId,
    },
    select: { id: true, financialAccountId: true },
  })

  if (!existing) {
    return {
      success: false,
      data: null,
      error: "Transaction not found.",
    }
  }

  await prisma.transaction.deleteMany({
    where: {
      id: existing.id,
      userId: data.userId,
    },
  })

  revalidateTag("transactions", "default")
  revalidateTag("summary", "default")
  revalidateTag(`account-${existing.financialAccountId}`, "default")

  return {
    success: true,
    data: { id: existing.id },
    error: null,
  }
}
