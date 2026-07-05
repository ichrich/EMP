import { NextResponse } from "next/server";
import { z } from "zod";
import { loginUser, sessionCookieName } from "@/shared/lib/server/content-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(request: Request) {
  const payload = loginSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });
  }

  const session = loginUser(payload.data);

  if (!session) {
    return NextResponse.json({ message: "Неверная почта или пароль" }, { status: 401 });
  }

  const response = NextResponse.json({ user: session.user });
  response.cookies.set(sessionCookieName, session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return response;
}
