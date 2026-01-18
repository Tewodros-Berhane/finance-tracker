import { z } from "zod"

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const transactionBaseSchema = z.object({
  financialAccountId: z.string().min(1),
  transferAccountId: z.preprocess(emptyToUndefined, z.string().optional()),
  categoryId: z.preprocess(emptyToUndefined, z.string().optional()),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z
    .string()
    .min(1)
    .refine((value) => Number(value) > 0 && !Number.isNaN(Number(value)), {
      message: "Amount must be a positive number",
    }),
  exchangeRate: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .optional()
      .refine(
        (value) =>
          value === undefined ||
          (Number(value) > 0 && !Number.isNaN(Number(value))),
        { message: "Exchange rate must be a positive number" }
      )
  ),
  date: z.coerce.date(),
  description: z.preprocess(emptyToUndefined, z.string().optional()),
  isRecurring: z.boolean().default(false),
})

const transactionRefine = (value: z.infer<typeof transactionBaseSchema>, ctx: z.RefinementCtx) => {
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

  if (value.type !== "TRANSFER" && value.exchangeRate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["exchangeRate"],
      message: "Exchange rate is only for transfers.",
    })
  }
}

export const createTransactionSchema = transactionBaseSchema.superRefine(
  transactionRefine
)

export const updateTransactionSchema = transactionBaseSchema
  .extend({
    id: z.string().min(1),
  })
  .superRefine(transactionRefine)
