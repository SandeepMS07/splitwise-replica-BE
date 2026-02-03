import prisma from "@/app/lib/prisma";
import { createGroupSchema } from "@/app/schemas/groups";
import { jsonResponse, ApiError, withApiHandler } from "@/app/lib/utils";
import { requireAuth } from "@/app/lib/auth";

export const GET = withApiHandler(async (request: Request) => {
  const user = requireAuth(request.headers);

  const groups = await prisma.group.findMany({
    where: {
      members: {
        some: { userId: user.id }
      }
    },
    include: {
      members: {
        include: { user: { select: { id: true, email: true, name: true } } }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return jsonResponse({ groups });
});

export const POST = withApiHandler(async (request: Request) => {
  const user = requireAuth(request.headers);
  const body = createGroupSchema.parse(await request.json());

  const emailList = (body.memberEmails ?? [])
    .map((email) => email.toLowerCase())
    .filter((email) => email !== user.email.toLowerCase());

  const existingUsers = emailList.length
    ? await prisma.user.findMany({
        where: { email: { in: emailList } },
        select: { id: true, email: true }
      })
    : [];

  if (emailList.length && existingUsers.length !== emailList.length) {
    const foundEmails = new Set(existingUsers.map((item) => item.email));
    const missing = emailList.filter((email) => !foundEmails.has(email));
    throw new ApiError(400, `Unknown member emails: ${missing.join(", ")}`, "UNKNOWN_MEMBERS");
  }

  const group = await prisma.$transaction(async (tx) => {
    const created = await tx.group.create({
      data: {
        name: body.name,
        createdById: user.id
      }
    });

    const membersData = [
      { userId: user.id, groupId: created.id },
      ...existingUsers.map((member) => ({
        userId: member.id,
        groupId: created.id
      }))
    ];

    await tx.groupMember.createMany({ data: membersData });
    return created;
  });

  return jsonResponse({ group }, 201);
});
