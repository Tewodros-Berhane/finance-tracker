import { z } from "zod"

export const onboardingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["CHECKING", "SAVINGS", "CREDIT", "CASH", "INVESTMENT"], {
    message: "Select an account type",
  }),
  currency: z.enum(["USD", "EUR", "GBP", "JPY"]).default("USD"),
  balance: z
    .string()
    .min(1, "Balance is required")
    .refine((value) => !Number.isNaN(Number(value)), {
      message: "Enter a valid balance",
    }),
})
