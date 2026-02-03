import bcrypt from "bcrypt";
import prisma from "@/app/lib/prisma";
import { loginSchema } from "@/app/schemas/auth";
import { jsonResponse, ApiError, withApiHandler } from "@/app/lib/utils";
import { isAdminEmail, signUserToken } from "@/app/lib/auth";

export const POST = withApiHandler(async (request: Request) => {
  const body = loginSchema.parse(await request.json());

  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() }
  });
  if (!user) {
    throw new ApiError(401, "Invalid credentials", "INVALID_CREDENTIALS");
  }

  const isValid = await bcrypt.compare(body.password, user.passwordHash);
  if (!isValid) {
    throw new ApiError(401, "Invalid credentials", "INVALID_CREDENTIALS");
  }

  const token = await signUserToken({
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: isAdminEmail(user.email)
  });

  return jsonResponse({
    user: { id: user.id, email: user.email, name: user.name },
    token
  });
});
