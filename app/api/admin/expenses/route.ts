import prisma from "@/app/lib/prisma";
import { jsonResponse, withApiHandler } from "@/app/lib/utils";
import { requireAuth, requireAdmin } from "@/app/lib/auth";

export const GET = withApiHandler(async (request: Request) => {
  const user = requireAuth(request.headers);
  requireAdmin(user);

  const expenses = await prisma.expense.findMany({
    include: {
      group: { select: { id: true, name: true } },
      paidBy: { select: { id: true, email: true, name: true } },
      splits: true
    },
    orderBy: { createdAt: "desc" }
  });

  return jsonResponse({ expenses });
});
