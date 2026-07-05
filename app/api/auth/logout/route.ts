import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logoutUser, sessionCookieName } from "@/shared/lib/server/content-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  logoutUser(cookieStore.get(sessionCookieName)?.value);

  const response = NextResponse.json({ user: null });
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });

  return response;
}
