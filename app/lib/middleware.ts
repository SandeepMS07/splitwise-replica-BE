import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifyUserToken } from "./auth";

const OPEN_PATHS = new Set(["/api/auth/register", "/api/auth/login"]);

function isOpenPath(pathname: string) {
  if (OPEN_PATHS.has(pathname)) {
    return true;
  }
  if (pathname.startsWith("/api/auth/") && pathname !== "/api/auth/me") {
    return true;
  }
  return false;
}

export async function authenticateRequest(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/api")) {
    return null;
  }

  if (isOpenPath(pathname)) {
    return null;
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length);
    try {
      return await verifyUserToken(token);
    } catch {
      return null;
    }
  }

  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!session?.sub || !session.email) {
    return null;
  }

  return {
    id: session.sub,
    email: session.email,
    name: (session.name as string | null) ?? null,
    isAdmin: Boolean(session.isAdmin)
  };
}
