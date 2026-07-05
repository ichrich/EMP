import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser, sessionCookieName } from "@/shared/lib/server/content-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(request: Request) {
  const payload = registerSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });
  }

  const session = registerUser(payload.data);

  if (!session) {
    return NextResponse.json({ message: "Пользователь уже существует" }, { status: 409 });
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
