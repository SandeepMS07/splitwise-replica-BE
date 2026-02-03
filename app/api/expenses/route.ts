import prisma from "@/app/lib/prisma";
import { createExpenseSchema } from "@/app/schemas/expenses";
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

  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: {
      splits: true,
      paidBy: { select: { id: true, email: true, name: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return jsonResponse({ expenses });
});

export const POST = withApiHandler(async (request: Request) => {
  const user = requireAuth(request.headers);
  const body = createExpenseSchema.parse(await request.json());

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId: body.groupId } }
  });

  if (!membership) {
    throw new ApiError(403, "Forbidden", "FORBIDDEN");
  }

  const memberIds = await prisma.groupMember.findMany({
    where: { groupId: body.groupId },
    select: { userId: true }
  });
  const memberIdSet = new Set(memberIds.map((item) => item.userId));

  if (!memberIdSet.has(body.paidById)) {
    throw new ApiError(400, "paidById is not a group member", "INVALID_PAYER");
  }

  for (const split of body.splits) {
    if (!memberIdSet.has(split.userId)) {
      throw new ApiError(400, `Split user ${split.userId} is not a group member`, "INVALID_SPLIT_USER");
    }
  }

  const totalSplits = body.splits.reduce((sum, split) => sum + split.amount, 0);
  if (Math.abs(totalSplits - body.amount) > 0.01) {
    throw new ApiError(400, "Split amounts must equal total amount", "SPLIT_MISMATCH");
  }

  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        description: body.description,
        amount: body.amount,
        currency: body.currency,
        groupId: body.groupId,
        paidById: body.paidById,
        createdById: user.id
      }
    });

    await tx.expenseSplit.createMany({
      data: body.splits.map((split) => ({
        expenseId: created.id,
        userId: split.userId,
        amount: split.amount
      }))
    });

    return created;
  });

  return jsonResponse({ expense }, 201);
});
