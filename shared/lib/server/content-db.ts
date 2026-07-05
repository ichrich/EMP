import "server-only";
import Database from "better-sqlite3";
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

const seedVersion = "4";
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
      initials TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      due_date TEXT NOT NULL,
      owner TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );
  `);
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
      dueDate: "Сегодня",
      owner: "Алексей Морозов"
    },
    {
      title: "Подписать обновленный NDA",
      description: "Документ доступен в разделе документов и ожидает электронной подписи.",
      status: "Новая",
      priority: "Средний",
      dueDate: "Завтра",
      owner: "Алексей Морозов"
    },
    {
      title: "Обновить цели на квартал",
      description: "Добавить измеримые результаты и отправить руководителю на проверку.",
      status: "На проверке",
      priority: "Средний",
      dueDate: "5 июля",
      owner: "Алексей Морозов"
    },
    {
      title: "Пройти обучение по безопасности",
      description: "Короткий курс по обновленным правилам доступа к внутренним системам.",
      status: "Готово",
      priority: "Низкий",
      dueDate: "Выполнено",
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
      "INSERT INTO users (id, name, role, department, email, location, status, initials) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const insertTask = database.prepare(
      "INSERT INTO tasks (title, description, status, priority, due_date, owner, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );

    insertUser.run(
      user.id,
      user.name,
      user.role,
      user.department,
      user.email,
      user.location,
      user.status,
      user.initials
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

export function getContent(): ContentResponse {
  const database = getDb();
  migrate(database);
  seed(database);

  const pageRows = database.prepare("SELECT * FROM pages ORDER BY rowid").all() as PageRow[];
  const currentUser = database.prepare("SELECT * FROM users WHERE id = 1").get() as {
    id: number;
    name: string;
    role: string;
    department: string;
    email: string;
    location: string;
    status: string;
    initials: string;
  };
  const taskRows = database
    .prepare(
      "SELECT id, title, description, status, priority, due_date as dueDate, owner FROM tasks ORDER BY sort_order"
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
