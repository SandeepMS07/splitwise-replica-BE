import prisma from "@/app/lib/prisma";
import { createSettlementSchema } from "@/app/schemas/settlements";
import { jsonResponse, ApiError, withApiHandler } from "@/app/lib/utils";
import { requireAuth } from "@/app/lib/auth";

export const POST = withApiHandler(async (request: Request) => {
  const user = requireAuth(request.headers);
  const body = createSettlementSchema.parse(await request.json());

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId: body.groupId } }
  });

  if (!membership) {
    throw new ApiError(403, "Forbidden", "FORBIDDEN");
  }

  const members = await prisma.groupMember.findMany({
    where: { groupId: body.groupId },
    select: { userId: true }
  });
  const memberIds = new Set(members.map((item) => item.userId));

  if (!memberIds.has(body.fromUserId) || !memberIds.has(body.toUserId)) {
    throw new ApiError(400, "Settlement users must be group members", "INVALID_SETTLEMENT_USER");
  }

  const settlement = await prisma.settlement.create({
    data: {
      groupId: body.groupId,
      fromUserId: body.fromUserId,
      toUserId: body.toUserId,
      amount: body.amount,
      createdById: user.id
    }
  });

  return jsonResponse({ settlement }, 201);
});
