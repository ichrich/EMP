import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken, sessionCookieName } from "@/shared/lib/server/content-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  return NextResponse.json({ user: getUserBySessionToken(cookieStore.get(sessionCookieName)?.value) });
}
