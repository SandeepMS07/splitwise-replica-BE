import prisma from "@/app/lib/prisma";
import { jsonResponse, ApiError, parseIdParam, withApiHandler } from "@/app/lib/utils";
import { requireAuth } from "@/app/lib/auth";

export const GET = withApiHandler(
  async (request: Request, context: { params: { id?: string } }) => {
    const user = requireAuth(request.headers);
    const groupId = parseIdParam(context.params.id);

    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.id, groupId } }
    });

    if (!membership) {
      throw new ApiError(403, "Forbidden", "FORBIDDEN");
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { user: { select: { id: true, email: true, name: true } } }
        },
        expenses: {
          include: { splits: true }
        }
      }
    });

    if (!group) {
      throw new ApiError(404, "Group not found", "GROUP_NOT_FOUND");
    }

    return jsonResponse({ group });
  }
);
