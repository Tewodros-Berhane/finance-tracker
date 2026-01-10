import { z } from "zod"

export const upsertCategorySchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1),
  name: z.string().min(2),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().min(1),
  color: z.string().min(1),
})
