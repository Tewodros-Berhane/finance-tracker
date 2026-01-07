import { z } from "zod"

export const accountTypes = [
  "CHECKING",
  "SAVINGS",
  "CREDIT",
  "CASH",
  "INVESTMENT",
] as const

export const currencies = ["USD", "EUR", "GBP", "JPY"] as const

export const onboardingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(accountTypes, { message: "Select an account type" }),
  currency: z.enum(currencies).default("USD"),
  balance: z
    .string()
    .min(1, "Balance is required")
    .refine((value) => !Number.isNaN(Number(value)), {
      message: "Enter a valid balance",
    }),
})

export type OnboardingValues = z.infer<typeof onboardingSchema>
