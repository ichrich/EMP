import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  getContent,
  sessionCookieName,
  updateUserProfile
} from "@/shared/lib/server/content-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const profileSchema = z.object({
  name: z.string().min(2),
  role: z.string().min(2),
  department: z.string().min(2),
  location: z.string().min(2),
  status: z.string().min(2)
});

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const updated = updateUserProfile(cookieStore.get(sessionCookieName)?.value, profileSchema.parse(await request.json()));

  if (!updated) {
    return NextResponse.json({ message: "Необходим вход в систему" }, { status: 401 });
  }

  return NextResponse.json(getContent(updated.id));
}
