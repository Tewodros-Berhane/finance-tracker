import { z } from "zod"

export const createTransactionSchema = z.object({
  financialAccountId: z.string().min(1),
  categoryId: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z
    .string()
    .min(1)
    .refine((value) => Number(value) > 0 && !Number.isNaN(Number(value)), {
      message: "Amount must be a positive number",
    }),
  date: z.coerce.date(),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
})
