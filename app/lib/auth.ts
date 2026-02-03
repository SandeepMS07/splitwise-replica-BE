import { SignJWT, jwtVerify } from "jose";
import { ApiError } from "./errors";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
};

function getJwtSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function signUserToken(user: AuthUser) {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getJwtSecret());
}

export async function verifyUserToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return {
    id: payload.sub as string,
    email: payload.email as string,
    name: (payload.name as string | null) ?? null,
    isAdmin: Boolean(payload.isAdmin)
  } satisfies AuthUser;
}

export function getAuthUserFromHeaders(headers: Headers) {
  const id = headers.get("x-user-id");
  const email = headers.get("x-user-email");
  if (!id || !email) {
    return null;
  }
  return {
    id,
    email,
    name: headers.get("x-user-name"),
    isAdmin: headers.get("x-user-is-admin") === "true"
  } as AuthUser;
}

export function requireAuth(headers: Headers) {
  const user = getAuthUserFromHeaders(headers);
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }
  return user;
}

export function requireAdmin(user: AuthUser) {
  if (!user.isAdmin) {
    throw new ApiError(403, "Forbidden");
  }
}

export function isAdminEmail(email: string) {
  const allowlist = (process.env.ADMIN_EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}
