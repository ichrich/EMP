import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getContent, getUserBySessionToken, sessionCookieName } from "@/shared/lib/server/content-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const user = getUserBySessionToken(cookieStore.get(sessionCookieName)?.value);

  if (!user) {
    return NextResponse.json({ message: "Необходим вход в систему" }, { status: 401 });
  }

  return NextResponse.json(getContent(user.id));
}
