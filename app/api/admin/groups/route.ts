import prisma from "@/app/lib/prisma";
import { jsonResponse, withApiHandler } from "@/app/lib/utils";
import { requireAuth, requireAdmin } from "@/app/lib/auth";

export const GET = withApiHandler(async (request: Request) => {
  const user = requireAuth(request.headers);
  requireAdmin(user);

  const groups = await prisma.group.findMany({
    include: {
      members: { include: { user: { select: { id: true, email: true, name: true } } } },
      createdBy: { select: { id: true, email: true, name: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return jsonResponse({ groups });
});
