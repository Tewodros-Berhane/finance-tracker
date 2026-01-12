"use server"

import { revalidateTag } from "next/cache"
import { z } from "zod"

import { getAuthenticatedUser } from "@/lib/services/auth.service"
import { prisma } from "../prisma"
import { upsertCategorySchema } from "./category.schema"

const deleteCategorySchema = z.object({
  id: z.string().min(1),
})

export type ActionResponse<T> = {
  success: boolean
  data: T | null
  error: string | null
}

export type CategoryActionState = ActionResponse<{ id: string }>

const uncategorizedDefaults = {
  name: "Uncategorized",
  type: "EXPENSE" as const,
  icon: "tag",
  color: "#64748b",
}

async function ensureUncategorized(userId: string) {
  const existing = await prisma.category.findFirst({
    where: { userId, name: uncategorizedDefaults.name },
    select: { id: true },
  })

  if (existing) {
    return existing.id
  }

  const created = await prisma.category.create({
    data: {
      userId,
      ...uncategorizedDefaults,
    },
    select: { id: true },
  })

  return created.id
}

export async function upsertCategory(
  state: CategoryActionState,
  input: z.infer<typeof upsertCategorySchema>
): Promise<CategoryActionState>
export async function upsertCategory(
  input: z.infer<typeof upsertCategorySchema>
): Promise<CategoryActionState>
export async function upsertCategory(
  stateOrInput: CategoryActionState | z.infer<typeof upsertCategorySchema>,
  maybeInput?: z.infer<typeof upsertCategorySchema>
): Promise<CategoryActionState> {
  const payload =
    maybeInput ?? (stateOrInput as z.infer<typeof upsertCategorySchema>)
  const parsed = upsertCategorySchema.safeParse(payload)

  if (!parsed.success) {
    return { success: false, data: null, error: "Invalid category payload." }
  }

  const user = await getAuthenticatedUser()
  if (!user) {
    return { success: false, data: null, error: "Unauthorized." }
  }

  const data = parsed.data

  const duplicate = await prisma.category.findFirst({
    where: {
      userId: user.id,
      name: { equals: data.name, mode: "insensitive" },
      ...(data.id ? { NOT: { id: data.id } } : {}),
    },
    select: { id: true },
  })

  if (duplicate) {
    return { success: false, data: null, error: "Category name already exists." }
  }

  if (data.id) {
    const existing = await prisma.category.findFirst({
      where: { id: data.id, userId: user.id },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, data: null, error: "Category not found." }
    }
  }

  const saved = data.id
    ? await prisma.category.update({
        where: { id: data.id },
        data: {
          name: data.name,
          type: data.type,
          icon: data.icon,
          color: data.color,
        },
        select: { id: true },
      })
    : await prisma.category.create({
        data: {
          userId: user.id,
          name: data.name,
          type: data.type,
          icon: data.icon,
          color: data.color,
        },
        select: { id: true },
      })

  revalidateTag("categories")

  return { success: true, data: { id: saved.id }, error: null }
}

export async function deleteCategory(
  input: z.infer<typeof deleteCategorySchema>
): Promise<ActionResponse<{ id: string }>> {
  const parsed = deleteCategorySchema.safeParse(input)

  if (!parsed.success) {
    return { success: false, data: null, error: "Invalid delete payload." }
  }

  const user = await getAuthenticatedUser()
  if (!user) {
    return { success: false, data: null, error: "Unauthorized." }
  }

  const data = parsed.data

  const existing = await prisma.category.findFirst({
    where: { id: data.id, userId: user.id },
    select: { id: true },
  })

  if (!existing) {
    return { success: false, data: null, error: "Category not found." }
  }

  const transactionCount = await prisma.transaction.count({
    where: { userId: user.id, categoryId: existing.id },
  })

  if (transactionCount > 0) {
    const uncategorizedId = await ensureUncategorized(user.id)

    await prisma.transaction.updateMany({
      where: { userId: user.id, categoryId: existing.id },
      data: { categoryId: uncategorizedId },
    })
  }

  await prisma.category.deleteMany({
    where: { id: existing.id, userId: user.id },
  })

  revalidateTag("categories")

  return { success: true, data: { id: existing.id }, error: null }
}
