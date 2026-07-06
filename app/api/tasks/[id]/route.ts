import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { deleteTask, getContent, getUserBySessionToken, sessionCookieName, updateTask } from "@/shared/lib/server/content-db";

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

const statusMap = {
  new: "Новая",
  in_progress: "В работе",
  review: "На проверке",
  done: "Готово",
  Новая: "Новая",
  "В работе": "В работе",
  "На проверке": "На проверке",
  Готово: "Готово"
} as const;

const prioritySchema = z.enum(["low", "medium", "high", "Низкий", "Средний", "Высокий"]).transform((value) => priorityMap[value]);
const statusSchema = z.enum(["new", "in_progress", "review", "done", "Новая", "В работе", "На проверке", "Готово"]).transform((value) => statusMap[value]);

const updateTaskSchema = z
  .object({
    title: z.string().trim().min(2).optional(),
    description: z.string().trim().min(2).optional(),
    status: statusSchema.optional(),
    priority: prioritySchema.optional(),
    startDate: z.string().date().optional(),
    dueDate: z.string().date().optional()
  })
  .refine(
    (payload) => {
      if (!payload.startDate || !payload.dueDate) {
        return true;
      }

      return payload.dueDate >= payload.startDate;
    },
    {
      message: "Дата завершения не может быть раньше даты начала",
      path: ["dueDate"]
    }
  );

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getAuthorizedUser() {
  const cookieStore = await cookies();
  return getUserBySessionToken(cookieStore.get(sessionCookieName)?.value);
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getAuthorizedUser();

  if (!user) {
    return NextResponse.json({ message: "Необходим вход в систему" }, { status: 401 });
  }

  const { id } = await context.params;
  const taskId = Number(id);
  const payload = updateTaskSchema.safeParse(await request.json());

  if (!Number.isInteger(taskId)) {
    return NextResponse.json({ message: "Некорректный идентификатор задачи" }, { status: 400 });
  }

  if (!payload.success) {
    return NextResponse.json({ message: payload.error.issues[0]?.message ?? "Некорректные данные" }, { status: 400 });
  }

  const updated = updateTask(taskId, payload.data);

  if (!updated) {
    return NextResponse.json({ message: "Задача не найдена" }, { status: 404 });
  }

  return NextResponse.json(getContent(user.id));
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getAuthorizedUser();

  if (!user) {
    return NextResponse.json({ message: "Необходим вход в систему" }, { status: 401 });
  }

  const { id } = await context.params;
  const taskId = Number(id);

  if (!Number.isInteger(taskId)) {
    return NextResponse.json({ message: "Некорректный идентификатор задачи" }, { status: 400 });
  }

  const deleted = deleteTask(taskId);

  if (!deleted) {
    return NextResponse.json({ message: "Задача не найдена" }, { status: 404 });
  }

  return NextResponse.json(getContent(user.id));
}
