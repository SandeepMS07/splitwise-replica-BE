import { z } from "zod";

export const createExpenseSchema = z.object({
  groupId: z.string().min(1),
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3).default("USD"),
  paidById: z.string().min(1),
  splits: z
    .array(
      z.object({
        userId: z.string().min(1),
        amount: z.number().positive()
      })
    )
    .min(1)
});
