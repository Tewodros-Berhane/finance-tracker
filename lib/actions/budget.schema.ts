import { z } from "zod"

export const upsertBudgetSchema = z.object({
  categoryId: z.string().min(1),
  amount: z
    .string()
    .min(1)
    .refine((value) => !Number.isNaN(Number(value)), {
      message: "Budget amount must be a number",
    }),
})
