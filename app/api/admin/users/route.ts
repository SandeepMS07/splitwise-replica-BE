import prisma from "@/app/lib/prisma";
import { jsonResponse, withApiHandler } from "@/app/lib/utils";
import { requireAuth, requireAdmin } from "@/app/lib/auth";

export const GET = withApiHandler(async (request: Request) => {
  const user = requireAuth(request.headers);
  requireAdmin(user);

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, createdAt: true }
  });

  return jsonResponse({ users });
});
