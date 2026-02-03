import { NextResponse, type NextRequest } from "next/server";
import { authenticateRequest } from "./app/lib/middleware";

export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const user = await authenticateRequest(req);
  const pathname = req.nextUrl.pathname;
  if (!user && pathname === "/api/auth/me") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user && !pathname.startsWith("/api/auth")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", user.id);
  requestHeaders.set("x-user-email", user.email);
  requestHeaders.set("x-user-name", user.name ?? "");
  requestHeaders.set("x-user-is-admin", String(user.isAdmin));

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/api/:path*"]
};
