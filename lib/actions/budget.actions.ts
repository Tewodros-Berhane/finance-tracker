"use server";

import { randomUUID } from "crypto";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/services/auth.service";
import { Prisma } from "./../../prisma/@/lib/generated/prisma/client";
import { prisma } from "../prisma";
import { convertFromBaseCurrency } from "../services/currency.service";
import { getUserCurrencySettings } from "../services/user.service";
import { upsertBudgetSchema } from "./budget.schema";

const deleteBudgetSchema = z.object({
  id: z.string().min(1),
});

export type ActionResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

export type BudgetActionState = ActionResponse<{ id: string }>;

export async function upsertBudget(
  state: BudgetActionState,
  input: z.infer<typeof upsertBudgetSchema>
): Promise<BudgetActionState>;
export async function upsertBudget(
  input: z.infer<typeof upsertBudgetSchema>
): Promise<BudgetActionState>;
export async function upsertBudget(
  stateOrInput: BudgetActionState | z.infer<typeof upsertBudgetSchema>,
  maybeInput?: z.infer<typeof upsertBudgetSchema>
): Promise<BudgetActionState> {
  const payload =
    maybeInput ?? (stateOrInput as z.infer<typeof upsertBudgetSchema>);
  const parsed = upsertBudgetSchema.safeParse(payload);

  if (!parsed.success) {
    return { success: false, data: null, error: "Invalid budget payload." };
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, data: null, error: "Unauthorized." };
  }

  const data = parsed.data;
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const currencySettings = await getUserCurrencySettings(user.id);
  const inputAmount = new Prisma.Decimal(data.amount);
  const normalizedAmount = convertFromBaseCurrency(
    inputAmount,
    "USD",
    currencySettings
  );

  const existing = await prisma.budget.findFirst({
    where: {
      userId: user.id,
      categoryId: data.categoryId,
      month,
      year,
    },
    select: { id: true },
  });

  const createId = randomUUID();
  const targetId = existing?.id ?? createId;

  const saved = await prisma.budget.upsert({
    where: { id: targetId },
    update: {
      amount: normalizedAmount.toString(),
      month,
      year,
    },
    create: {
      id: targetId,
      userId: user.id,
      categoryId: data.categoryId,
      amount: normalizedAmount.toString(),
      month,
      year,
    },
    select: { id: true },
  });

  revalidateTag("budgets", "max");

  return { success: true, data: { id: saved.id }, error: null };
}

export async function deleteBudget(
  input: z.infer<typeof deleteBudgetSchema>
): Promise<ActionResponse<{ id: string }>> {
  const parsed = deleteBudgetSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, data: null, error: "Invalid delete payload." };
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, data: null, error: "Unauthorized." };
  }

  const data = parsed.data;

  const existing = await prisma.budget.findFirst({
    where: { id: data.id, userId: user.id },
    select: { id: true },
  });

  if (!existing) {
    return { success: false, data: null, error: "Budget not found." };
  }

  await prisma.budget.deleteMany({
    where: { id: existing.id, userId: user.id },
  });

  revalidateTag("budgets", "max");

  return { success: true, data: { id: existing.id }, error: null };
}
