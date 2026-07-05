import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  createTask,
  getContent,
  getUserBySessionToken,
  sessionCookieName
} from "@/shared/lib/server/content-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  priority: z.enum(["Низкий", "Средний", "Высокий"]),
  dueDate: z.string().min(1)
});

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const user = getUserBySessionToken(cookieStore.get(sessionCookieName)?.value);

  if (!user) {
    return NextResponse.json({ message: "Необходим вход в систему" }, { status: 401 });
  }

  const payload = createTaskSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });
  }

  createTask({
    ...payload.data,
    owner: user.name
  });

  return NextResponse.json(getContent(user.id));
}
