import { z } from "zod"

export const upsertGoalSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1),
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
})

export const updateGoalProgressSchema = z.object({
  userId: z.string().min(1),
  id: z.string().min(1),
  amount: z
    .string()
    .min(1)
    .refine((value) => Number(value) > 0 && !Number.isNaN(Number(value)), {
      message: "Contribution must be a positive number",
    }),
})
