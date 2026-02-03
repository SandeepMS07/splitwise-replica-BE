import bcrypt from "bcrypt";
import prisma from "@/app/lib/prisma";
import { registerSchema } from "@/app/schemas/auth";
import { jsonResponse, ApiError, withApiHandler } from "@/app/lib/utils";
import { isAdminEmail, signUserToken } from "@/app/lib/auth";

export const POST = withApiHandler(async (request: Request) => {
  const body = registerSchema.parse(await request.json());

  const existing = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() }
  });
  if (existing) {
    throw new ApiError(409, "Email already in use", "EMAIL_EXISTS");
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({
    data: {
      email: body.email.toLowerCase(),
      name: body.name ?? null,
      passwordHash
    }
  });

  const token = await signUserToken({
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: isAdminEmail(user.email)
  });

  return jsonResponse(
    {
      user: { id: user.id, email: user.email, name: user.name },
      token
    },
    201
  );
});
