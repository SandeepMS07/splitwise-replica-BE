import prisma from "@/app/lib/prisma";
import { jsonResponse, ApiError, withApiHandler } from "@/app/lib/utils";
import { requireAuth } from "@/app/lib/auth";

export const GET = withApiHandler(async (request: Request) => {
  const user = requireAuth(request.headers);
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");

  if (!groupId) {
    throw new ApiError(400, "groupId is required", "MISSING_GROUP_ID");
  }

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } }
  });

  if (!membership) {
    throw new ApiError(403, "Forbidden", "FORBIDDEN");
  }

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, email: true, name: true } } }
  });

  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: { splits: true }
  });

  const settlements = await prisma.settlement.findMany({
    where: { groupId }
  });

  const balances = new Map(
    members.map((member) => [
      member.userId,
      {
        user: member.user,
        paid: 0,
        owed: 0,
        settlementsOut: 0,
        settlementsIn: 0
      }
    ])
  );

  for (const expense of expenses) {
    const paid = balances.get(expense.paidById);
    if (paid) {
      paid.paid += Number(expense.amount);
    }
    for (const split of expense.splits) {
      const owed = balances.get(split.userId);
      if (owed) {
        owed.owed += Number(split.amount);
      }
    }
  }

  for (const settlement of settlements) {
    const from = balances.get(settlement.fromUserId);
    const to = balances.get(settlement.toUserId);
    if (from) {
      from.settlementsOut += Number(settlement.amount);
    }
    if (to) {
      to.settlementsIn += Number(settlement.amount);
    }
  }

  const results = Array.from(balances.values()).map((entry) => {
    const net =
      entry.paid - entry.owed - entry.settlementsOut + entry.settlementsIn;
    return {
      user: entry.user,
      paid: Number(entry.paid.toFixed(2)),
      owed: Number(entry.owed.toFixed(2)),
      settlementsOut: Number(entry.settlementsOut.toFixed(2)),
      settlementsIn: Number(entry.settlementsIn.toFixed(2)),
      balance: Number(net.toFixed(2))
    };
  });

  return jsonResponse({ balances: results });
});
