import { z } from "zod";

export const createSettlementSchema = z.object({
  groupId: z.string().min(1),
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  amount: z.number().positive()
});
