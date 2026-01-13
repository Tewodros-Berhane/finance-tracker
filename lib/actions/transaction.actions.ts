"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { z } from "zod"
import { Prisma } from "../generated/prisma/client"

import { getAuthenticatedUser } from "@/lib/services/auth.service"
import { updateAccountBalance } from "@/lib/services/account.service"
import { prisma } from "../prisma"
import { createTransactionSchema } from "./transaction.schema"

const deleteTransactionSchema = z.object({
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

  const user = await getAuthenticatedUser()
  if (!user) {
    return { success: false, data: null, error: "Unauthorized." }
  }

  const data = parsed.data

  if (data.type === "TRANSFER") {
    if (!data.transferAccountId) {
      return {
        success: false,
        data: null,
        error: "Destination account is required.",
      }
    }

    if (data.transferAccountId === data.financialAccountId) {
      return {
        success: false,
        data: null,
        error: "Transfer accounts must be different.",
      }
    }

    const [fromAccount, toAccount] = await Promise.all([
      prisma.financialAccount.findFirst({
        where: {
          id: data.financialAccountId,
          userId: user.id,
        },
        select: { id: true, name: true, balance: true },
      }),
      prisma.financialAccount.findFirst({
        where: {
          id: data.transferAccountId,
          userId: user.id,
        },
        select: { id: true, name: true, balance: true },
      }),
    ])

    if (!fromAccount || !toAccount) {
      return {
        success: false,
        data: null,
        error: "Account not found.",
      }
    }

    const amount = new Prisma.Decimal(data.amount)
    const description = data.description?.trim()
    let created: { id: string }

    try {
      created = await prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
          data: {
            userId: user.id,
            financialAccountId: fromAccount.id,
            categoryId: null,
            type: "TRANSFER",
            amount: amount.toString(),
            date: data.date,
            description: description ?? `Transfer to ${toAccount.name}`,
            isRecurring: data.isRecurring,
          },
          select: { id: true },
        })

        const fromBalance = new Prisma.Decimal(fromAccount.balance).minus(amount)
        const toBalance = new Prisma.Decimal(toAccount.balance).plus(amount)

        const [fromUpdated, toUpdated] = await Promise.all([
          updateAccountBalance(user.id, fromAccount.id, fromBalance, tx),
          updateAccountBalance(user.id, toAccount.id, toBalance, tx),
        ])

        if (!fromUpdated || !toUpdated) {
          throw new Error("Unable to update account balances.")
        }

        return transaction
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to complete transfer."
      return { success: false, data: null, error: message }
    }

    revalidateTag("transactions", "max")
    revalidateTag("summary", "max")
    revalidateTag("accounts", "max")
    revalidateTag(`account-${fromAccount.id}`, "max")
    revalidateTag(`account-${toAccount.id}`, "max")
    revalidatePath("/transactions")
    revalidatePath("/accounts")
    revalidatePath("/dashboard")

    return {
      success: true,
      data: { id: created.id },
      error: null,
    }
  }

  const account = await prisma.financialAccount.findFirst({
    where: {
      id: data.financialAccountId,
      userId: user.id,
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

  if (data.categoryId && data.type === "EXPENSE") {
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        userId: user.id,
        type: "EXPENSE",
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
      userId: user.id,
      financialAccountId: data.financialAccountId,
      categoryId: data.type === "EXPENSE" ? data.categoryId ?? null : null,
      type: data.type,
      amount: data.amount,
      date: data.date,
      description: data.description ?? null,
      isRecurring: data.isRecurring,
    },
    select: { id: true },
  })
  revalidateTag("transactions", "max")
  revalidateTag("summary", "max")
  revalidateTag("accounts", "max")
  revalidateTag(`account-${data.financialAccountId}`, "max")
  revalidatePath("/transactions")
  revalidatePath("/accounts")
  revalidatePath("/dashboard")

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

  const user = await getAuthenticatedUser()
  if (!user) {
    return { success: false, data: null, error: "Unauthorized." }
  }

  const data = parsed.data

  const existing = await prisma.transaction.findFirst({
    where: {
      id: data.id,
      userId: user.id,
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
      userId: user.id,
    },
  })

  revalidateTag("transactions", "max")
  revalidateTag("summary", "max")
  revalidateTag("accounts", "max")
  revalidateTag(`account-${existing.financialAccountId}`, "max")
  revalidatePath("/transactions")
  revalidatePath("/accounts")
  revalidatePath("/dashboard")

  return {
    success: true,
    data: { id: existing.id },
    error: null,
  }
}
