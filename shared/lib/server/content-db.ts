import "server-only";
import Database from "better-sqlite3";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import type {
  ContentCard,
  ContentPage,
  ContentResponse,
  ContentSection,
  ContentTask,
  ContentUser
} from "@/entities/content/model/types";
import type { PortalView } from "@/features/portal-preferences/model/portal-slice";

type PageRow = {
  id: PortalView;
  title: string;
  description: string;
  actions: string;
};

type UserRow = ContentUser & {
  password_hash: string;
};

export const sessionCookieName = "emp_session";

const seedVersion = "7";
const dbDirectory = path.join(process.cwd(), "data");
const dbPath = process.env.DATABASE_PATH ?? path.join(dbDirectory, "portal.sqlite");

let db: Database.Database | null = null;

function getDb() {
  if (!existsSync(dbDirectory)) {
    mkdirSync(dbDirectory, { recursive: true });
  }

  db ??= new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      actions TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id TEXT NOT NULL,
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id TEXT NOT NULL,
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      variant TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      email TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT NOT NULL,
      initials TEXT NOT NULL,
      password_hash TEXT NOT NULL DEFAULT ''
    );

    CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email);

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      start_date TEXT NOT NULL DEFAULT '',
      due_date TEXT NOT NULL,
      owner TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );
  `);

  const columns = database.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;

  if (!columns.some((column) => column.name === "password_hash")) {
    database.prepare("ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT ''").run();
  }

  const taskColumns = database.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;

  if (!taskColumns.some((column) => column.name === "start_date")) {
    database.prepare("ALTER TABLE tasks ADD COLUMN start_date TEXT NOT NULL DEFAULT ''").run();
  }
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");

  if (!salt || !hash) {
    return false;
  }

  const candidate = pbkdf2Sync(password, salt, 100000, 64, "sha512");
  const expected = Buffer.from(hash, "hex");

  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

function toInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function seed(database: Database.Database) {
  const meta = database
    .prepare("SELECT value FROM app_meta WHERE key = ?")
    .get("content_seed_version") as { value: string } | undefined;

  if (meta?.value === seedVersion) {
    return;
  }

  const pages: ContentPage[] = [
    {
      id: "layout",
      title: "Рабочий стол сотрудника",
      description:
        "Краткий обзор задач, заявок и важных событий на сегодня. Экран помогает быстро понять, что требует внимания.",
      actions: ["Создать задачу", "Открыть календарь"],
      cards: [
        { title: "Активные задачи", text: "8 задач в работе, 3 из них требуют реакции сегодня." },
        { title: "Заявки", text: "2 заявки ожидают согласования руководителем." },
        { title: "Документы", text: "1 документ готов к подписанию." },
        { title: "Команда", text: "6 коллег онлайн, 2 работают удаленно." }
      ],
      sections: [
        {
          title: "Приоритетные задачи",
          text: "Список ближайших задач сотрудника с понятным статусом, сроком и приоритетом.",
          variant: "large"
        },
        {
          title: "Профиль пользователя",
          text: "Короткая сводка по текущему пользователю и рабочему статусу.",
          variant: "default"
        }
      ]
    },
    {
      id: "profile",
      title: "Профиль сотрудника",
      description:
        "Основные данные пользователя, должность, отдел, рабочая локация и контактная информация.",
      actions: ["Редактировать", "Скачать карточку"],
      cards: [
        { title: "Должность", text: "Product Manager" },
        { title: "Отдел", text: "Продуктовая команда" },
        { title: "Локация", text: "Иркутск, гибридный формат" },
        { title: "Статус", text: "На рабочем месте" }
      ],
      sections: [
        {
          title: "Контактная информация",
          text: "Рабочая почта, отдел, роль и текущий статус сотрудника.",
          variant: "large"
        },
        {
          title: "Ближайшие задачи",
          text: "Задачи, закрепленные за пользователем на текущую неделю.",
          variant: "default"
        }
      ]
    },
    {
      id: "settings",
      title: "Настройки портала",
      description:
        "Управление уведомлениями, темой интерфейса, безопасностью и персональными предпочтениями.",
      actions: ["Сохранить настройки"],
      cards: [
        { title: "Уведомления", text: "Email и системные уведомления включены." },
        { title: "Безопасность", text: "Двухфакторная проверка готова к подключению." },
        { title: "Интерфейс", text: "Используется системная тема оформления." },
        { title: "Доступ", text: "Роль пользователя: сотрудник." }
      ],
      sections: [
        {
          title: "Основные настройки",
          text: "Базовые параметры интерфейса и уведомлений пользователя.",
          variant: "large"
        },
        {
          title: "Безопасность",
          text: "Настройки входа, сессий и подтверждения действий.",
          variant: "default"
        }
      ]
    }
  ];

  const tasks: Array<Omit<ContentTask, "id">> = [
    {
      title: "Проверить заявку на отпуск",
      description: "Согласовать даты и убедиться, что в команде остается покрытие задач.",
      status: "В работе",
      priority: "Высокий",
      startDate: "2026-07-05",
      dueDate: "2026-07-05",
      owner: "Алексей Морозов"
    },
    {
      title: "Подписать обновленный NDA",
      description: "Документ доступен в разделе документов и ожидает электронной подписи.",
      status: "Новая",
      priority: "Средний",
      startDate: "2026-07-06",
      dueDate: "2026-07-07",
      owner: "Алексей Морозов"
    },
    {
      title: "Обновить цели на квартал",
      description: "Добавить измеримые результаты и отправить руководителю на проверку.",
      status: "На проверке",
      priority: "Средний",
      startDate: "2026-07-03",
      dueDate: "2026-07-08",
      owner: "Алексей Морозов"
    },
    {
      title: "Пройти обучение по безопасности",
      description: "Короткий курс по обновленным правилам доступа к внутренним системам.",
      status: "Готово",
      priority: "Низкий",
      startDate: "2026-07-01",
      dueDate: "2026-07-04",
      owner: "Алексей Морозов"
    }
  ];

  const user: ContentUser = {
    id: 1,
    name: "Алексей Морозов",
    role: "Product Manager",
    department: "Продуктовая команда",
    email: "alexey.morozov@emp.local",
    location: "Иркутск",
    status: "На рабочем месте",
    initials: "АМ"
  };

  const transaction = database.transaction(() => {
    database.prepare("DELETE FROM cards").run();
    database.prepare("DELETE FROM sections").run();
    database.prepare("DELETE FROM pages").run();
    database.prepare("DELETE FROM tasks").run();
    database.prepare("DELETE FROM users").run();
    database.prepare("DELETE FROM sessions").run();

    const insertPage = database.prepare(
      "INSERT INTO pages (id, title, description, actions) VALUES (?, ?, ?, ?)"
    );
    const insertCard = database.prepare(
      "INSERT INTO cards (page_id, title, text, sort_order) VALUES (?, ?, ?, ?)"
    );
    const insertSection = database.prepare(
      "INSERT INTO sections (page_id, title, text, variant, sort_order) VALUES (?, ?, ?, ?, ?)"
    );
    const insertUser = database.prepare(
      "INSERT INTO users (id, name, role, department, email, location, status, initials, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const insertTask = database.prepare(
      "INSERT INTO tasks (title, description, status, priority, start_date, due_date, owner, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );

    insertUser.run(
      user.id,
      user.name,
      user.role,
      user.department,
      user.email,
      user.location,
      user.status,
      user.initials,
      hashPassword("password123")
    );

    pages.forEach((page) => {
      insertPage.run(page.id, page.title, page.description, JSON.stringify(page.actions));
      page.cards.forEach((card, index) => {
        insertCard.run(page.id, card.title, card.text, index);
      });
      page.sections.forEach((section, index) => {
        insertSection.run(page.id, section.title, section.text, section.variant, index);
      });
    });

    tasks.forEach((task, index) => {
      insertTask.run(
        task.title,
        task.description,
        task.status,
        task.priority,
        task.startDate,
        task.dueDate,
        task.owner,
        index
      );
    });

    database
      .prepare("INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)")
      .run("content_seed_version", seedVersion);
  });

  transaction();
}

function selectUserById(database: Database.Database, userId: number) {
  return database
    .prepare("SELECT id, name, role, department, email, location, status, initials FROM users WHERE id = ?")
    .get(userId) as ContentUser | undefined;
}

function createSession(database: Database.Database, user: ContentUser) {
  const token = randomBytes(32).toString("hex");

  database
    .prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))")
    .run(token, user.id);

  return { token, user };
}

export function getUserBySessionToken(token?: string) {
  if (!token) {
    return null;
  }

  const database = getDb();
  migrate(database);
  seed(database);

  const session = database
    .prepare("SELECT user_id as userId FROM sessions WHERE token = ? AND expires_at > datetime('now')")
    .get(token) as { userId: number } | undefined;

  return session ? (selectUserById(database, session.userId) ?? null) : null;
}

export function loginUser(payload: { email: string; password: string }) {
  const database = getDb();
  migrate(database);
  seed(database);

  const row = database.prepare("SELECT * FROM users WHERE lower(email) = lower(?)").get(payload.email) as
    | UserRow
    | undefined;

  if (!row || !verifyPassword(payload.password, row.password_hash)) {
    return null;
  }

  const user = selectUserById(database, row.id);

  return user ? createSession(database, user) : null;
}

export function registerUser(payload: { name: string; email: string; password: string }) {
  const database = getDb();
  migrate(database);
  seed(database);

  const existing = database.prepare("SELECT id FROM users WHERE lower(email) = lower(?)").get(payload.email);

  if (existing) {
    return null;
  }

  const result = database
    .prepare(
      "INSERT INTO users (name, role, department, email, location, status, initials, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .run(
      payload.name,
      "Сотрудник",
      "Новая команда",
      payload.email,
      "Не указано",
      "Активен",
      toInitials(payload.name),
      hashPassword(payload.password)
    );

  const user = selectUserById(database, Number(result.lastInsertRowid));

  return user ? createSession(database, user) : null;
}

export function updateUserProfile(
  token: string | undefined,
  payload: {
    name: string;
    role: string;
    department: string;
    location: string;
    status: string;
  }
) {
  const user = getUserBySessionToken(token);

  if (!user) {
    return null;
  }

  const database = getDb();
  migrate(database);

  database
    .prepare(
      "UPDATE users SET name = ?, role = ?, department = ?, location = ?, status = ?, initials = ? WHERE id = ?"
    )
    .run(
      payload.name,
      payload.role,
      payload.department,
      payload.location,
      payload.status,
      toInitials(payload.name),
      user.id
    );

  return selectUserById(database, user.id) ?? null;
}

export function logoutUser(token?: string) {
  if (!token) {
    return;
  }

  const database = getDb();
  migrate(database);
  database.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function createTask(payload: {
  title: string;
  description: string;
  priority: ContentTask["priority"];
  startDate: string;
  dueDate: string;
  owner: string;
}) {
  const database = getDb();
  migrate(database);
  seed(database);

  const nextOrder = database
    .prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 as value FROM tasks")
    .get() as { value: number };

  database
    .prepare(
      "INSERT INTO tasks (title, description, status, priority, start_date, due_date, owner, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .run(
      payload.title,
      payload.description,
      "Новая",
      payload.priority,
      payload.startDate,
      payload.dueDate,
      payload.owner,
      nextOrder.value
    );
}

export function updateTask(
  taskId: number,
  payload: Partial<{
    title: string;
    description: string;
    status: ContentTask["status"];
    priority: ContentTask["priority"];
    startDate: string;
    dueDate: string;
  }>
) {
  const database = getDb();
  migrate(database);
  seed(database);

  const current = database
    .prepare(
      "SELECT id, title, description, status, priority, start_date as startDate, due_date as dueDate FROM tasks WHERE id = ?"
    )
    .get(taskId) as
    | Pick<ContentTask, "description" | "dueDate" | "id" | "priority" | "startDate" | "status" | "title">
    | undefined;

  if (!current) {
    return false;
  }

  database
    .prepare(
      `UPDATE tasks
       SET title = ?, description = ?, status = ?, priority = ?, start_date = ?, due_date = ?
       WHERE id = ?`
    )
    .run(
      payload.title ?? current.title,
      payload.description ?? current.description,
      payload.status ?? current.status,
      payload.priority ?? current.priority,
      payload.startDate ?? current.startDate,
      payload.dueDate ?? current.dueDate,
      taskId
    );

  return true;
}

export function deleteTask(taskId: number) {
  const database = getDb();
  migrate(database);
  seed(database);

  const result = database.prepare("DELETE FROM tasks WHERE id = ?").run(taskId);

  return result.changes > 0;
}

export function getContent(userId = 1): ContentResponse {
  const database = getDb();
  migrate(database);
  seed(database);

  const pageRows = database.prepare("SELECT * FROM pages ORDER BY rowid").all() as PageRow[];
  const currentUser = (selectUserById(database, userId) ?? selectUserById(database, 1)) as ContentUser;
  const taskRows = database
    .prepare(
            `SELECT id, title, description, status, priority, start_date as startDate, due_date as dueDate, owner
       FROM tasks
       ORDER BY
         CASE priority WHEN 'Высокий' THEN 0 WHEN 'Средний' THEN 1 ELSE 2 END,
         due_date ASC,
         start_date ASC,
         sort_order ASC`
    )
    .all() as ContentTask[];
  const cardsStatement = database.prepare(
    "SELECT title, text FROM cards WHERE page_id = ? ORDER BY sort_order"
  );
  const sectionsStatement = database.prepare(
    "SELECT title, text, variant FROM sections WHERE page_id = ? ORDER BY sort_order"
  );

  const pages = pageRows.reduce(
    (acc, page) => {
      acc[page.id] = {
        id: page.id,
        title: page.title,
        description: page.description,
        actions: JSON.parse(page.actions) as string[],
        cards: cardsStatement.all(page.id) as ContentCard[],
        sections: sectionsStatement.all(page.id) as ContentSection[]
      };

      return acc;
    },
    {} as ContentResponse["pages"]
  );

  return {
    currentUser,
    pages,
    tasks: taskRows
  };
}
