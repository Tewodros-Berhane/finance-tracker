"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "../../../prisma/@/lib/generated/prisma/client";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/services/auth.service";
import { prisma } from "../prisma";
import {
  updateCurrencySettingsSchema,
  updateProfileSchema,
} from "./user.schema";

export type ActionResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

type ProfileActionState = ActionResponse<{ id: string }>;
type CurrencyActionState = ActionResponse<{ id: string }>;
type DeleteActionState = ActionResponse<{ id: string }>;

export async function updateProfile(
  state: ProfileActionState,
  input: z.infer<typeof updateProfileSchema>
): Promise<ProfileActionState>;
export async function updateProfile(
  input: z.infer<typeof updateProfileSchema>
): Promise<ProfileActionState>;
export async function updateProfile(
  stateOrInput: ProfileActionState | z.infer<typeof updateProfileSchema>,
  maybeInput?: z.infer<typeof updateProfileSchema>
): Promise<ProfileActionState> {
  const payload =
    maybeInput ?? (stateOrInput as z.infer<typeof updateProfileSchema>);
  const parsed = updateProfileSchema.safeParse(payload);

  if (!parsed.success) {
    return { success: false, data: null, error: "Invalid profile details." };
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, data: null, error: "Unauthorized." };
  }

  const { name, email } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: {
      email,
      id: { not: user.id },
    },
    select: { id: true },
  });

  if (existing) {
    return {
      success: false,
      data: null,
      error: "That email address is already in use.",
    };
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: name.trim(),
      email: email.trim(),
    },
    select: { id: true },
  });

  revalidateTag("settings", "max");
  revalidateTag(user.id, "max");
  revalidatePath("/settings");

  return { success: true, data: { id: updated.id }, error: null };
}

export async function updateCurrencySettings(
  state: CurrencyActionState,
  input: z.infer<typeof updateCurrencySettingsSchema>
): Promise<CurrencyActionState>;
export async function updateCurrencySettings(
  input: z.infer<typeof updateCurrencySettingsSchema>
): Promise<CurrencyActionState>;
export async function updateCurrencySettings(
  stateOrInput:
    | CurrencyActionState
    | z.infer<typeof updateCurrencySettingsSchema>,
  maybeInput?: z.infer<typeof updateCurrencySettingsSchema>
): Promise<CurrencyActionState> {
  const payload =
    maybeInput ??
    (stateOrInput as z.infer<typeof updateCurrencySettingsSchema>);
  const parsed = updateCurrencySettingsSchema.safeParse(payload);

  if (!parsed.success) {
    return { success: false, data: null, error: "Invalid currency settings." };
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, data: null, error: "Unauthorized." };
  }

  const rate = new Prisma.Decimal(parsed.data.exchangeRate.replace(/,/g, ""));
  if (!rate.isFinite() || rate.lte(0)) {
    return {
      success: false,
      data: null,
      error: "Exchange rate must be a positive number.",
    };
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      baseCurrency: parsed.data.baseCurrency,
      usdToBirrRate: rate.toString(),
    },
    select: { id: true },
  });

  revalidateTag("settings", "max");
  revalidateTag(user.id, "max");
  revalidateTag("summary", "max");
  revalidateTag("accounts", "max");
  revalidateTag("budgets", "max");
  revalidateTag("goals", "max");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/budgets");
  revalidatePath("/goals");
  revalidatePath("/categories");

  return { success: true, data: { id: updated.id }, error: null };
}

export async function deleteAccount(
  state?: DeleteActionState
): Promise<DeleteActionState> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, data: null, error: "Unauthorized." };
  }

  try {
    const deleted = await prisma.user.delete({
      where: { id: user.id },
      select: { id: true },
    });

    revalidateTag("settings", "max");
    revalidateTag(user.id, "max");
    revalidatePath("/");

    return { success: true, data: { id: deleted.id }, error: null };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: "Unable to delete account.",
    };
  }
}
