import { NextResponse, type NextRequest } from "next/server";

const sessionCookieName = "emp_session";
const authRoutes = new Set(["/login", "/register"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(sessionCookieName)?.value);
  const isAuthRoute = authRoutes.has(pathname);

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isAuthRoute && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
