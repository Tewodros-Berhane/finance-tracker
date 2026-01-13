import { z } from "zod"

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Enter a valid email address."),
})

export const updateCurrencySettingsSchema = z.object({
  baseCurrency: z.enum(["USD", "BIRR"]),
  exchangeRate: z
    .string()
    .min(1, "Exchange rate is required.")
    .refine((value) => {
      const normalized = value.replace(/,/g, "")
      const numeric = Number(normalized)
      return !Number.isNaN(numeric) && numeric > 0
    }, "Exchange rate must be a positive number."),
})
