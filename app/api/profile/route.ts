import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getContent, sessionCookieName, updateUserProfile } from "@/shared/lib/server/content-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const profileSchema = z.object({
  name: z.string().trim().min(2),
  role: z.string().trim().min(2),
  department: z.string().trim().min(2),
  location: z.string().trim().min(2),
  status: z.string().trim().min(2)
});

export async function PATCH(request: Request) {
  const payload = profileSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ message: payload.error.issues[0]?.message ?? "Некорректные данные" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const updated = updateUserProfile(cookieStore.get(sessionCookieName)?.value, payload.data);

  if (!updated) {
    return NextResponse.json({ message: "Необходим вход в систему" }, { status: 401 });
  }

  return NextResponse.json(getContent(updated.id));
}
