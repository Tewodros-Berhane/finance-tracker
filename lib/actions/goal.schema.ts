import { z } from "zod"

export const upsertGoalSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  targetAmount: z
    .string()
    .min(1)
    .refine((value) => Number(value) > 0 && !Number.isNaN(Number(value)), {
      message: "Target amount must be a positive number",
    }),
  currentAmount: z
    .string()
    .optional()
    .default("0")
    .refine((value) => !Number.isNaN(Number(value)), {
      message: "Current amount must be a number",
    }),
  deadline: z.coerce.date().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  financialAccountId: z
    .string()
    .optional()
    .refine((value) => !value || value.length > 0, {
      message: "Select an account",
    }),
}).superRefine((value, ctx) => {
  const currentAmount = Number(value.currentAmount ?? "0")
  if (currentAmount > 0 && !value.financialAccountId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["financialAccountId"],
      message: "Select an account for the current amount",
    })
  }
})

export const updateGoalProgressSchema = z.object({
  id: z.string().min(1),
  amount: z
    .string()
    .min(1)
    .refine((value) => Number(value) > 0 && !Number.isNaN(Number(value)), {
      message: "Contribution must be a positive number",
    }),
  financialAccountId: z.string().min(1, "Select an account"),
})
