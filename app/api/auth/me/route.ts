import prisma from "@/app/lib/prisma";
import { jsonResponse, ApiError, withApiHandler } from "@/app/lib/utils";
import { requireAuth } from "@/app/lib/auth";

export const GET = withApiHandler(async (request: Request) => {
  const user = requireAuth(request.headers);
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, createdAt: true }
  });

  if (!dbUser) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  return jsonResponse({ user: dbUser });
});
