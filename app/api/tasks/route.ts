import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createTask, getContent, getUserBySessionToken, sessionCookieName } from "@/shared/lib/server/content-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const priorityMap = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  Низкий: "Низкий",
  Средний: "Средний",
  Высокий: "Высокий"
} as const;

const createTaskSchema = z
  .object({
    title: z.string().trim().min(2),
    description: z.string().trim().min(2),
    priority: z.enum(["low", "medium", "high", "Низкий", "Средний", "Высокий"]).transform((value) => priorityMap[value]),
    startDate: z.string().date(),
    dueDate: z.string().date()
  })
  .refine((payload) => payload.dueDate >= payload.startDate, {
    message: "Дата завершения не может быть раньше даты начала",
    path: ["dueDate"]
  });

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const user = getUserBySessionToken(cookieStore.get(sessionCookieName)?.value);

  if (!user) {
    return NextResponse.json({ message: "Необходим вход в систему" }, { status: 401 });
  }

  const payload = createTaskSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ message: payload.error.issues[0]?.message ?? "Некорректные данные" }, { status: 400 });
  }

  createTask({
    ...payload.data,
    owner: user.name
  });

  return NextResponse.json(getContent(user.id));
}
