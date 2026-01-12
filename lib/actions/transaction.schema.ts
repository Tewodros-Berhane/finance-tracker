import { z } from "zod"

export const createTransactionSchema = z.object({
  financialAccountId: z.string().min(1),
  transferAccountId: z.string().optional(),
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
}).superRefine((value, ctx) => {
  if (value.type === "TRANSFER") {
    if (!value.transferAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["transferAccountId"],
        message: "Select a destination account.",
      })
    } else if (value.transferAccountId === value.financialAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["transferAccountId"],
        message: "Destination account must be different.",
      })
    }

    if (value.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categoryId"],
        message: "Transfers cannot have a category.",
      })
    }
  } else {
    if (value.transferAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["transferAccountId"],
        message: "Destination account is only for transfers.",
      })
    }

    if (value.type !== "EXPENSE" && value.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categoryId"],
        message: "Only expenses can have a category.",
      })
    }
  }
})
