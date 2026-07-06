"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  SlidersHorizontal,
  Trash2
} from "lucide-react";
import { useGetSessionQuery } from "@/entities/auth/api/auth-api";
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetContentQuery,
  useUpdateTaskMutation,
  useUpdateProfileMutation
} from "@/entities/content/api/content-api";
import type { ContentPage, ContentTask, ContentUser } from "@/entities/content/model/types";
import { setActiveView } from "@/features/portal-preferences/model/portal-slice";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/redux";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge, type BadgeProps } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Field, Input } from "@/shared/ui/input";
import { Loader } from "@/shared/ui/loader";
import { Modal } from "@/shared/ui/modal";
import { PortalLayout } from "@/widgets/layout";
import "./portal-dashboard-page.css";

const priorityTone: Record<ContentTask["priority"], BadgeProps["tone"]> = {
  Низкий: "neutral",
  Средний: "warning",
  Высокий: "danger"
};

const statusTone: Record<ContentTask["status"], BadgeProps["tone"]> = {
  Новая: "info",
  "В работе": "warning",
  "На проверке": "neutral",
  Готово: "success"
};

const priorityWeight: Record<ContentTask["priority"], number> = {
  Высокий: 0,
  Средний: 1,
  Низкий: 2
};

type PortalModal = "task" | "taskDetails" | "profile" | "settings" | "calendar" | null;
type CalendarStackModal = "task" | "taskDetails" | null;
type TaskSort = "dueDate" | "priority" | "status";
type SelectOption<T extends string> = {
  label: string;
  value: T;
};

const todayIso = "2026-07-06";

const taskSortOptions: SelectOption<TaskSort>[] = [
  { label: "По сроку", value: "dueDate" },
  { label: "По срочности", value: "priority" },
  { label: "По статусу", value: "status" }
];

const priorityOptions: SelectOption<"low" | "medium" | "high">[] = [
  { label: "Низкий", value: "low" },
  { label: "Средний", value: "medium" },
  { label: "Высокий", value: "high" }
];

const notificationOptions: SelectOption<string>[] = [
  { label: "Все события", value: "Все события" },
  { label: "Только важные", value: "Только важные" },
  { label: "Отключить", value: "Отключить" }
];

const modeOptions: SelectOption<string>[] = [
  { label: "Операционный", value: "Операционный" },
  { label: "Фокус", value: "Фокус" },
  { label: "Руководитель", value: "Руководитель" }
];

const densityOptions: SelectOption<string>[] = [
  { label: "Компактная", value: "Компактная" },
  { label: "Комфортная", value: "Комфортная" },
  { label: "Свободная", value: "Свободная" }
];

const profileStatusOptions: SelectOption<string>[] = [
  { label: "Активен", value: "Активен" },
  { label: "В отпуске", value: "В отпуске" },
  { label: "На больничном", value: "На больничном" },
  { label: "Свой вариант", value: "custom" }
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function daysUntil(value: string) {
  const current = new Date(`${todayIso}T00:00:00`).getTime();
  const target = new Date(`${value}T00:00:00`).getTime();
  return Math.round((target - current) / 86_400_000);
}

function getUrgency(task: ContentTask) {
  if (task.status === "Готово") {
    return "done";
  }

  const delta = daysUntil(task.dueDate);

  if (delta < 0) {
    return "overdue";
  }

  if (delta === 0) {
    return "today";
  }

  if (delta <= 7) {
    return "week";
  }

  return "later";
}

function getUrgencyLabel(task: ContentTask) {
  const urgency = getUrgency(task);

  if (urgency === "done") {
    return "Завершено";
  }

  if (urgency === "overdue") {
    return `Просрочено на ${Math.abs(daysUntil(task.dueDate))} дн.`;
  }

  if (urgency === "today") {
    return "Сегодня";
  }

  if (urgency === "week") {
    return `Осталось ${daysUntil(task.dueDate)} дн.`;
  }

  return "Позже";
}

function toDayNumber(value: string) {
  return Math.floor(new Date(`${value}T00:00:00`).getTime() / 86_400_000);
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function addMonths(value: string, months: number) {
  const date = new Date(`${value}-01T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return toIsoDate(date).slice(0, 7);
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isWeekend(value: string) {
  const day = new Date(`${value}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

function buildMonthDays(monthIso: string) {
  const monthDate = new Date(`${monthIso}-01T00:00:00`);
  const monthStart = toIsoDate(monthDate);
  const firstDay = monthDate.getDay() || 7;
  const gridStart = addDays(monthStart, 1 - firstDay);

  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function buildTimelineDays(tasks: ContentTask[]) {
  if (tasks.length === 0) {
    return [todayIso];
  }

  const minStart = tasks.reduce((min, task) => (task.startDate < min ? task.startDate : min), tasks[0]?.startDate ?? todayIso);
  const maxEnd = tasks.reduce((max, task) => (task.dueDate > max ? task.dueDate : max), tasks[0]?.dueDate ?? todayIso);
  const start = addDays(minStart, -1);
  const end = addDays(maxEnd, 2);
  const total = Math.max(1, toDayNumber(end) - toDayNumber(start) + 1);

  return Array.from({ length: total }, (_, index) => addDays(start, index));
}

function buildEmployeeCardPrintPage(user: ContentUser) {
  const safeUser = {
    department: escapeHtml(user.department),
    email: escapeHtml(user.email),
    location: escapeHtml(user.location),
    name: escapeHtml(user.name),
    role: escapeHtml(user.role),
    status: escapeHtml(user.status)
  };

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Карточка сотрудника - ${safeUser.name}</title>
    <style>
      @page { size: A4; margin: 18mm; }
      * { box-sizing: border-box; }
      body { margin: 0; background: rgb(5, 6, 7); color: rgb(248, 250, 252); font-family: Inter, Arial, sans-serif; }
      .page { min-height: 100vh; display: grid; place-items: center; padding: 32px; background: repeating-radial-gradient(ellipse at 58% 92%, transparent 0 42px, rgba(248, 250, 252, .08) 43px 44px), linear-gradient(180deg, rgb(5, 6, 7), rgb(12, 14, 16)); }
      .card { width: min(760px, 100%); overflow: hidden; border: 1px solid rgba(248, 250, 252, .18); border-radius: 18px; background: rgba(12, 14, 16, .96); box-shadow: 0 28px 80px rgba(0, 0, 0, .42); }
      .hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; border-bottom: 1px solid rgba(248, 250, 252, .14); padding: 34px; }
      .logo-slot { width: 64px; height: 64px; flex: 0 0 auto; border: 1px dashed rgba(248, 250, 252, .28); border-radius: 12px; background: rgba(248, 250, 252, .035); }
      .eyebrow { margin: 0 0 14px; color: rgba(248, 250, 252, .58); font-size: 11px; font-weight: 800; letter-spacing: .24em; text-transform: uppercase; }
      h1 { margin: 0; font-size: 34px; line-height: 1.05; }
      .role { margin: 10px 0 0; color: rgba(248, 250, 252, .7); font-weight: 700; }
      .body { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; padding: 28px 34px 34px; }
      .item { display: grid; gap: 9px; border: 1px solid rgba(248, 250, 252, .12); border-radius: 12px; padding: 18px; background: rgba(248, 250, 252, .045); }
      .label { color: rgba(248, 250, 252, .52); font-size: 11px; font-weight: 900; letter-spacing: .16em; text-transform: uppercase; }
      .value { color: rgb(248, 250, 252); font-size: 16px; font-weight: 800; }
      .footer { display: flex; justify-content: space-between; gap: 16px; border-top: 1px solid rgba(248, 250, 252, .12); padding: 18px 34px; color: rgba(248, 250, 252, .56); font-size: 12px; font-weight: 800; }
      @media print { body { background: rgb(5, 6, 7); -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { min-height: auto; padding: 0; } .card { box-shadow: none; } }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="card">
        <div class="hero">
          <div>
            <p class="eyebrow">Employee card</p>
            <h1>${safeUser.name}</h1>
            <p class="role">${safeUser.role}</p>
          </div>
          <div class="logo-slot"></div>
        </div>
        <div class="body">
          <div class="item"><span class="label">Отдел</span><span class="value">${safeUser.department}</span></div>
          <div class="item"><span class="label">Email</span><span class="value">${safeUser.email}</span></div>
          <div class="item"><span class="label">Локация</span><span class="value">${safeUser.location}</span></div>
          <div class="item"><span class="label">Статус</span><span class="value">${safeUser.status}</span></div>
        </div>
        <footer class="footer"><span>Enterprise Employee Portal</span><span>Сформировано локально</span></footer>
      </section>
    </main>
    <script>
      window.addEventListener("load", () => {
        window.focus();
        window.print();
      });
    </script>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function printEmployeeCardPdf(user: ContentUser) {
  const printWindow = window.open("", "_blank", "width=900,height=760");

  if (!printWindow) {
    return;
  }

  printWindow.document.open();
  printWindow.document.write(buildEmployeeCardPrintPage(user));
  printWindow.document.close();
}

function SelectMenu<T extends string>({
  className = "",
  icon,
  name,
  onChange,
  options,
  value
}: {
  className?: string;
  icon?: ReactNode;
  name?: string;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  value: T;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  return (
    <div
      className={["select-menu", open ? "select-menu--open" : "", className].filter(Boolean).join(" ")}
      onBlur={(event) => {
        const nextTarget = event.relatedTarget;

        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
          setOpen(false);
        }
      }}
    >
      {name ? <input name={name} type="hidden" value={value} /> : null}
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className="select-menu__trigger"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        type="button"
      >
        {icon ? <span className="select-menu__icon">{icon}</span> : null}
        <span className="select-menu__value">{selectedOption?.label}</span>
        <ChevronDown className="select-menu__chevron" size={16} aria-hidden="true" />
      </button>
      {open ? (
        <div className="select-menu__content" role="listbox" tabIndex={-1}>
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                aria-selected={selected}
                className={selected ? "select-menu__option select-menu__option--active" : "select-menu__option"}
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                onMouseDown={(event) => event.preventDefault()}
                role="option"
                type="button"
              >
                <span>{option.label}</span>
                {selected ? <Check size={15} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function TaskTracker({ onOpenTask, tasks }: { onOpenTask: (task: ContentTask) => void; tasks: ContentTask[] }) {
  const [sort, setSort] = useState<TaskSort>("dueDate");
  const [query, setQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const filteredTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => {
        const matchesQuery = `${task.title} ${task.description} ${task.owner}`.toLowerCase().includes(query.toLowerCase());
        return matchesQuery;
      })
      .sort((first, second) => {
        if (sort === "priority") {
          return priorityWeight[first.priority] - priorityWeight[second.priority] || first.dueDate.localeCompare(second.dueDate);
        }

        if (sort === "status") {
          return first.status.localeCompare(second.status, "ru") || first.dueDate.localeCompare(second.dueDate);
        }

        return first.dueDate.localeCompare(second.dueDate) || priorityWeight[first.priority] - priorityWeight[second.priority];
      });
  }, [query, sort, tasks]);

  const timelineDays = useMemo(() => buildTimelineDays(filteredTasks), [filteredTasks]);
  const timelineStart = timelineDays[0] ?? todayIso;
  const selectedTask = filteredTasks.find((task) => task.id === selectedTaskId) ?? filteredTasks[0];
  const timelineStyle = {
    "--timeline-days": timelineDays.length
  } as CSSProperties;

  return (
    <div className="tracker tracker--gantt">
      <div className="tracker__toolbar">
        <div className="tracker__search">
          <Input onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по задачам" value={query} />
        </div>
        <SelectMenu
          className="tracker__select"
          icon={<SlidersHorizontal size={16} />}
          onChange={setSort}
          options={taskSortOptions}
          value={sort}
        />
        <div className="tracker__summary">
          <CalendarDays size={16} />
          <span>{filteredTasks.length} задач</span>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="tracker__empty">
          <strong>Задачи не найдены</strong>
          <span>Измените поиск или создайте новую задачу.</span>
        </div>
      ) : (
      <div className="gantt" style={timelineStyle}>
        <div className="gantt__tasks">
          <div className="gantt__tasks-header">
            <span>Задача</span>
            <span>Срок</span>
          </div>
          {filteredTasks.map((task) => (
            <button
              className={selectedTask?.id === task.id ? "gantt-task gantt-task--active" : "gantt-task"}
              key={task.id}
            onClick={() => {
              setSelectedTaskId(task.id);
              onOpenTask(task);
            }}
              type="button"
            >
              <span className="gantt-task__title">{task.title}</span>
              <span className="gantt-task__date">{formatDate(task.dueDate)}</span>
            </button>
          ))}
        </div>

        <div className="gantt__timeline">
          <div className="gantt__scale">
            {timelineDays.map((day) => (
              <span className={day === todayIso ? "gantt__day gantt__day--today" : "gantt__day"} key={day}>
                {new Date(`${day}T00:00:00`).getDate()}
              </span>
            ))}
          </div>
          <div className="gantt__rows">
            {filteredTasks.map((task) => {
              const start = Math.max(1, toDayNumber(task.startDate) - toDayNumber(timelineStart) + 1);
              const span = Math.max(1, toDayNumber(task.dueDate) - toDayNumber(task.startDate) + 1);
              const priorityClass = `gantt-bar--${task.priority === "Высокий" ? "high" : task.priority === "Средний" ? "medium" : "low"}`;

              return (
                <div className="gantt__row" key={task.id}>
                  <button
                    className={
                      selectedTask?.id === task.id
                        ? `gantt-bar ${priorityClass} gantt-bar--active`
                        : `gantt-bar ${priorityClass}`
                    }
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      onOpenTask(task);
                    }}
                    style={{ gridColumn: `${start} / span ${span}` }}
                    type="button"
                  >
                    <span>{task.title}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

    </div>
  );
}

function UserSummary({ user }: { user: ContentUser }) {
  return (
    <div className="user-summary">
      <Avatar className="user-summary__avatar">
        <AvatarFallback>{user.initials}</AvatarFallback>
      </Avatar>
      <div>
        <h3 className="user-summary__name">{user.name}</h3>
        <p className="user-summary__role">{user.role}</p>
      </div>
      <div className="user-summary__details">
        <span>{user.department}</span>
        <span>{user.location}</span>
        <span>{user.email}</span>
        <Badge tone="success">{user.status}</Badge>
      </div>
    </div>
  );
}

function WorkspaceContent({
  onOpenTask,
  page,
  tasks,
  user
}: {
  onOpenTask: (task: ContentTask) => void;
  page: ContentPage;
  tasks: ContentTask[];
  user: ContentUser;
}) {
  const [primarySection, secondarySection] = page.sections;

  if (page.id === "profile") {
    return (
      <section className="mockup__workspace">
        <Card className="mockup-panel mockup-panel--large">
          <CardContent>
            <div className="mockup-panel__header">
              <span>{primarySection?.title ?? "Контактная информация"}</span>
              <Badge tone="success">Активен</Badge>
            </div>
            <p className="mockup-panel__text">{primarySection?.text}</p>
            <div className="profile-details">
              <div>
                <span>Имя</span>
                <strong>{user.name}</strong>
              </div>
              <div>
                <span>Роль</span>
                <strong>{user.role}</strong>
              </div>
              <div>
                <span>Отдел</span>
                <strong>{user.department}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{user.email}</strong>
              </div>
              <div>
                <span>Локация</span>
                <strong>{user.location}</strong>
              </div>
              <div>
                <span>Статус</span>
                <strong>{user.status}</strong>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mockup-panel">
          <CardContent>
            <div className="mockup-panel__header">
              <span>{secondarySection?.title ?? "Ближайшие задачи"}</span>
            </div>
            <p className="mockup-panel__text">{secondarySection?.text}</p>
            <div className="compact-task-list">
              {tasks.slice(0, 4).map((task) => (
                <div className="compact-task" key={task.id}>
                  <strong>{task.title}</strong>
                  <span>{formatDate(task.dueDate)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (page.id === "settings") {
    return (
      <section className="mockup__workspace">
        <Card className="mockup-panel mockup-panel--large">
          <CardContent>
            <div className="mockup-panel__header">
              <span>{primarySection?.title ?? "Основные настройки"}</span>
              <Badge tone="info">Локально</Badge>
            </div>
            <p className="mockup-panel__text">{primarySection?.text}</p>
            <div className="settings-grid">
              <div>
                <span>Уведомления</span>
                <strong>Email и системные события</strong>
              </div>
              <div>
                <span>Рабочий режим</span>
                <strong>Операционный</strong>
              </div>
              <div>
                <span>Плотность списка</span>
                <strong>Комфортная</strong>
              </div>
              <div>
                <span>Тема</span>
                <strong>Светлая / темная</strong>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mockup-panel">
          <CardContent>
            <div className="mockup-panel__header">
              <span>{secondarySection?.title ?? "Безопасность"}</span>
            </div>
            <p className="mockup-panel__text">{secondarySection?.text}</p>
            <div className="security-list">
              <Badge tone="success">Сессия активна</Badge>
              <Badge tone="warning">2FA не подключена</Badge>
              <Badge tone="neutral">SQLite local</Badge>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mockup__workspace">
      <Card className="mockup-panel mockup-panel--large">
        <CardContent>
          <div className="mockup-panel__header">
            <span>{primarySection?.title ?? "Задачи"}</span>
            <Badge tone="info">{tasks.length} задач</Badge>
          </div>
          <p className="mockup-panel__text">{primarySection?.text}</p>
          <TaskTracker onOpenTask={onOpenTask} tasks={tasks} />
        </CardContent>
      </Card>

      <Card className="mockup-panel">
        <CardContent>
          <div className="mockup-panel__header">
            <span>{secondarySection?.title ?? "Пользователь"}</span>
          </div>
          <p className="mockup-panel__text">{secondarySection?.text}</p>
          <UserSummary user={user} />
        </CardContent>
      </Card>
    </section>
  );
}

function ProductPage({
  onAction,
  onCardAction,
  onOpenTask,
  page,
  tasks,
  user
}: {
  onAction: (index: number) => void;
  onCardAction: (index: number) => void;
  onOpenTask: (task: ContentTask) => void;
  page: ContentPage;
  tasks: ContentTask[];
  user: ContentUser;
}) {
  return (
    <>
      <section className="mockup__hero">
        <div>
          <h2 className="mockup__title">{page.title}</h2>
          <p className="mockup__description">{page.description}</p>
        </div>
        <div className="mockup__actions">
          {page.actions.map((action, index) => (
             <Button key={action} onClick={() => onAction(index)} variant={index === 0 ? "primary" : "outline"}>
              {index === 1 && page.id === "profile" ? <Download size={16} /> : null}
              {action}
            </Button>
          ))}
        </div>
      </section>

      <section className="mockup__grid">
        {page.cards.map((card, index) => (
          <Card
            className="mockup-card mockup-card--action"
            key={card.title}
            onClick={() => onCardAction(index)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onCardAction(index);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <CardContent>
              <div className="mockup-card__label">{card.title}</div>
              <p className="mockup-card__text">{card.text}</p>
              <span className="mockup-card__hint">Открыть</span>
            </CardContent>
          </Card>
        ))}
      </section>

      <WorkspaceContent onOpenTask={onOpenTask} page={page} tasks={tasks} user={user} />
    </>
  );
}

function TaskModal({
  initialDate = todayIso,
  layer = "base",
  onClose,
  open
}: {
  initialDate?: string;
  layer?: "base" | "stacked";
  onClose: () => void;
  open: boolean;
}) {
  const [createTask, createTaskState] = useCreateTaskMutation();
  const [error, setError] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);

    try {
      await createTask({
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? ""),
        priority: String(form.get("priority") ?? "medium") as "low" | "medium" | "high",
        startDate: String(form.get("startDate") ?? ""),
        dueDate: String(form.get("dueDate") ?? "")
      }).unwrap();
      onClose();
    } catch {
      setError("Проверьте название, описание и диапазон дат");
    }
  }

  return (
    <Modal
      className={layer === "stacked" ? "modal__content--task-create" : undefined}
      description="Укажите период выполнения: дата начала и дата завершения будут использоваться для сортировки."
      layer={layer}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      open={open}
      title="Новая задача"
    >
      <form className="product-form" onSubmit={handleSubmit}>
        <Field label="Название">
          <Input name="title" placeholder="Согласовать документ" required />
        </Field>
        <Field label="Описание">
          <Input name="description" placeholder="Кратко опишите задачу" required />
        </Field>
        <div className="product-form__grid">
          <Field label="Дата начала">
            <Input defaultValue={initialDate} name="startDate" required type="date" />
          </Field>
          <Field label="Дата завершения">
            <Input defaultValue={initialDate} name="dueDate" required type="date" />
          </Field>
        </div>
        <Field label="Срочность">
          <SelectMenu name="priority" onChange={setPriority} options={priorityOptions} value={priority} />
        </Field>

        {error ? <p className="product-form__error">{error}</p> : null}
        <div className="product-form__actions">
          <Button disabled={createTaskState.isLoading} type="submit">
            Создать
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function TaskDetailsModal({
  layer = "base",
  onClose,
  open,
  task
}: {
  layer?: "base" | "stacked";
  onClose: () => void;
  open: boolean;
  task?: ContentTask;
}) {
  const [updateTask, updateTaskState] = useUpdateTaskMutation();
  const [deleteTask, deleteTaskState] = useDeleteTaskMutation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!task) {
    return null;
  }

  async function handleDelete() {
    if (!task) {
      return;
    }

    await deleteTask(task.id).unwrap();
    onClose();
  }

  const hasDeadlineWarning = task.status !== "Готово" && daysUntil(task.dueDate) <= 2;
  const hasWeekendWarning = isWeekend(task.startDate) || isWeekend(task.dueDate);

  return (
    <Modal
      className={layer === "stacked" ? "modal__content--task-details" : undefined}
      description="Просмотрите задачу и измените ее состояние."
      layer={layer}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      open={open}
      title={task.title}
    >
      <div className="task-modal">
        <div className="task-modal__summary">
          <div>
            <span>Период</span>
            <strong>
              {formatDate(task.startDate)} → {formatDate(task.dueDate)}
            </strong>
          </div>
          <div>
            <span>Ответственный</span>
            <strong>{task.owner}</strong>
          </div>
          <div>
            <span>Приоритет</span>
            <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
          </div>
          <div>
            <span>Статус</span>
            <Badge tone={statusTone[task.status]}>{task.status}</Badge>
          </div>
        </div>

        <p className="task-modal__description">{task.description}</p>

        {hasDeadlineWarning || hasWeekendWarning ? (
          <div className="task-modal__warnings">
            {hasDeadlineWarning ? (
              <div className="task-warning">
                <AlertTriangle size={16} />
                <span>{getUrgencyLabel(task)}</span>
              </div>
            ) : null}
            {hasWeekendWarning ? (
              <div className="task-warning">
                <CalendarDays size={16} />
                <span>Период затрагивает выходной день</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {confirmDelete ? (
          <div className="task-modal__confirm" role="alert">
            <strong>Удалить задачу?</strong>
            <span>Действие нельзя отменить, задача исчезнет из списка и календаря.</span>
          </div>
        ) : null}

        <div className="task-modal__actions">
          <Button
            disabled={updateTaskState.isLoading}
            onClick={() => void updateTask({ id: task.id, body: { status: "in_progress" } })}
            type="button"
            variant="outline"
          >
            В работу
          </Button>
          <Button
            disabled={updateTaskState.isLoading}
            onClick={() => void updateTask({ id: task.id, body: { status: "review" } })}
            type="button"
            variant="outline"
          >
            На проверку
          </Button>
          <Button disabled={updateTaskState.isLoading} onClick={() => void updateTask({ id: task.id, body: { status: "done" } })} type="button">
            <CheckCircle2 size={16} />
            Завершить
          </Button>
          <Button
            disabled={deleteTaskState.isLoading}
            onClick={() => {
              if (!confirmDelete) {
                setConfirmDelete(true);
                return;
              }

              void handleDelete();
            }}
            type="button"
            variant="destructive"
          >
            <Trash2 size={16} />
            {confirmDelete ? "Удалить окончательно" : "Удалить"}
          </Button>
          {confirmDelete ? (
            <Button disabled={deleteTaskState.isLoading} onClick={() => setConfirmDelete(false)} type="button" variant="outline">
              Отмена
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

function ProfileModal({ onClose, open, user }: { onClose: () => void; open: boolean; user: ContentUser }) {
  const [updateProfile, updateProfileState] = useUpdateProfileMutation();
  const [error, setError] = useState("");
  const initialStatusChoice = profileStatusOptions.some((option) => option.value === user.status) ? user.status : "custom";
  const [statusChoice, setStatusChoice] = useState(initialStatusChoice);
  const [customStatus, setCustomStatus] = useState(initialStatusChoice === "custom" ? user.status : "");

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextStatusChoice = profileStatusOptions.some((option) => option.value === user.status) ? user.status : "custom";
    setStatusChoice(nextStatusChoice);
    setCustomStatus(nextStatusChoice === "custom" ? user.status : "");
  }, [open, user.status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);

    try {
      await updateProfile({
        name: String(form.get("name") ?? ""),
        role: String(form.get("role") ?? ""),
        department: String(form.get("department") ?? ""),
        location: String(form.get("location") ?? ""),
        status: String(form.get("status") ?? "")
      }).unwrap();
      onClose();
    } catch {
      setError("Не удалось обновить профиль");
    }
  }

  return (
    <Modal
      description="Изменения сохраняются в профиле текущего пользователя."
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      open={open}
      title="Редактировать профиль"
    >
      <form className="product-form" onSubmit={handleSubmit}>
        <Field label="Имя">
          <Input defaultValue={user.name} name="name" required />
        </Field>
        <Field label="Роль">
          <Input defaultValue={user.role} name="role" required />
        </Field>
        <Field label="Отдел">
          <Input defaultValue={user.department} name="department" required />
        </Field>
        <Field label="Локация">
          <Input defaultValue={user.location} name="location" required />
        </Field>
        <Field label="Статус">
          <SelectMenu onChange={setStatusChoice} options={profileStatusOptions} value={statusChoice} />
          {statusChoice === "custom" ? (
            <Input
              name="status"
              onChange={(event) => setCustomStatus(event.target.value)}
              placeholder="Например: На выезде"
              required
              value={customStatus}
            />
          ) : (
            <input name="status" type="hidden" value={statusChoice} />
          )}
        </Field>
        {error ? <p className="product-form__error">{error}</p> : null}
        <div className="product-form__actions">
          <Button disabled={updateProfileState.isLoading} type="submit">
            Сохранить
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function SettingsModal({ onClose, open }: { onClose: () => void; open: boolean }) {

  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState("Все события");
  const [mode, setMode] = useState("Операционный");
  const [density, setDensity] = useState("Комфортная");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    localStorage.setItem(
      "emp_preferences",
      JSON.stringify({
        notifications: form.get("notifications"),
        mode: form.get("mode"),
        density: form.get("density")
      })
    );
    setSaved(true);
  }
    return (
    <Modal
      description="Настройки интерфейса и уведомлений сохраняются локально для текущего браузера."
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
          setSaved(false);
        }
      }}
      open={open}
      title="Настройки портала"
    >
    <form className="product-form" onSubmit={handleSubmit}>
        <Field label="Уведомления">
          <SelectMenu name="notifications" onChange={setNotifications} options={notificationOptions} value={notifications} />
        </Field>
        <Field label="Рабочий режим">
          <SelectMenu name="mode" onChange={setMode} options={modeOptions} value={mode} />
        </Field>
        <Field label="Плотность списка">
          <SelectMenu name="density" onChange={setDensity} options={densityOptions} value={density} />
        </Field>
        {saved ? <p className="product-form__success">Настройки сохранены</p> : null}
        <div className="product-form__actions">
          <Button type="submit">Сохранить</Button>
        </div>
      </form>
    </Modal>
  );
}

function CalendarModal({
  onCreateTask,
  onClose,
  onOpenTask,
  open,
  tasks
}: {
  onCreateTask: (date: string) => void;
  onClose: () => void;
  onOpenTask: (task: ContentTask) => void;
  open: boolean;
  tasks: ContentTask[];
}) {
  const [monthIso, setMonthIso] = useState(todayIso.slice(0, 7));
  const [monthAnimationKey, setMonthAnimationKey] = useState(0);
  const [focusedTaskId, setFocusedTaskId] = useState<number | null>(null);
  const monthGridRef = useRef<HTMLDivElement>(null);
  const monthDays = useMemo(() => buildMonthDays(monthIso), [monthIso]);
  const monthLabel = new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric"
  }).format(new Date(`${monthIso}-01T00:00:00`));
  const warningTasks = tasks.filter(
    (task) => task.status !== "Готово" && (daysUntil(task.dueDate) <= 2 || isWeekend(task.startDate) || isWeekend(task.dueDate))
  );

  useEffect(() => {
    if (!focusedTaskId) {
      return;
    }

    const focusedElement = monthGridRef.current?.querySelector(`[data-task-id="${focusedTaskId}"]`);
    focusedElement?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

    const timer = window.setTimeout(() => setFocusedTaskId(null), 1800);

    return () => window.clearTimeout(timer);
  }, [focusedTaskId, monthDays]);

  function handleMonthShift(direction: -1 | 1) {
    setMonthAnimationKey((current) => current + 1);
    setMonthIso((currentMonth) => addMonths(currentMonth, direction));
  }

  function focusTaskInCalendar(task: ContentTask) {
    setMonthAnimationKey((current) => current + 1);
    setMonthIso(task.startDate.slice(0, 7));
    setFocusedTaskId(task.id);
  }

  function returnToCurrentMonth() {
    setMonthAnimationKey((current) => current + 1);
    setFocusedTaskId(null);
    setMonthIso(todayIso.slice(0, 7));
  }

  return (
    <Modal
      description="Месячный календарь задач с предупреждениями по срокам и выходным."
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      open={open}
      title="Календарь задач"
    >
      <div className="calendar-board">
        <aside className="calendar-board__aside">
          <div className="calendar-board__today">
            <strong>{new Date(`${todayIso}T00:00:00`).getDate()}</strong>
            <span>{formatDate(todayIso)}</span>
          </div>
          <div className="calendar-board__warnings">
            <span className="calendar-board__label">Предупреждения</span>
            {warningTasks.length > 0 ? (
              warningTasks.slice(0, 5).map((task) => (
                <button
                  className="calendar-warning"
                  key={task.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    focusTaskInCalendar(task);
                  }}
                  type="button"
                >
                  <AlertTriangle size={15} />
                  <span>{task.title}</span>
                </button>
              ))
            ) : (
              <p className="calendar-board__empty">Критичных задач нет</p>
            )}
          </div>
        </aside>

        <section className="calendar-month">
          <div className="calendar-month__toolbar">
            <Button onClick={() => handleMonthShift(-1)} type="button" variant="outline">
              Назад
            </Button>
            <div className="calendar-month__title">
              <strong>{monthLabel}</strong>
              {monthIso !== todayIso.slice(0, 7) ? (
                <Button onClick={returnToCurrentMonth} size="sm" type="button" variant="ghost">
                  Текущий месяц
                </Button>
              ) : null}
            </div>
            <Button onClick={() => handleMonthShift(1)} type="button" variant="outline">
              Вперед
            </Button>
          </div>
          <div className="calendar-month__weekdays">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-month__grid" key={monthAnimationKey} ref={monthGridRef}>
            {monthDays.map((day) => {
              const dayTasks = tasks.filter((task) => task.startDate <= day && task.dueDate >= day);
              const outsideMonth = !day.startsWith(monthIso);
              const weekend = isWeekend(day);
              const focusedTask = focusedTaskId ? tasks.find((task) => task.id === focusedTaskId) : undefined;
              const focusedRange = focusedTask ? focusedTask.startDate <= day && focusedTask.dueDate >= day : false;

              return (
                <div
                  className={[
                    "calendar-day",
                    outsideMonth ? "calendar-day--muted" : "",
                    weekend ? "calendar-day--weekend" : "",
                    day === todayIso ? "calendar-day--today" : "",
                    dayTasks.length === 0 ? "calendar-day--empty" : "",
                    focusedRange ? "calendar-day--focused-range" : ""
                  ].filter(Boolean).join(" ")}
                  key={day}
                  onClick={() => {
                    if (dayTasks.length === 0) {
                      onCreateTask(day);
                    }
                  }}
                >
                  <div className="calendar-day__number">
                    <span>{new Date(`${day}T00:00:00`).getDate()}</span>
                    {weekend ? <Badge tone="warning">выходной</Badge> : null}
                  </div>
                  <div className="calendar-day__tasks">
                    {dayTasks.slice(0, 3).map((task) => (
                      <button
                        className={[
                          "calendar-task",
                          `calendar-task--${task.priority === "Высокий" ? "high" : task.priority === "Средний" ? "medium" : "low"}`,
                          task.status === "Готово" ? "calendar-task--done" : "",
                          task.id === focusedTaskId ? "calendar-task--focused" : ""
                        ].filter(Boolean).join(" ")}
                        data-task-id={task.id}
                        key={task.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenTask(task);
                        }}
                        type="button"
                      >
                        {daysUntil(task.dueDate) <= 2 && task.status !== "Готово" ? <AlertTriangle size={12} /> : null}
                        <span>{task.title}</span>
                      </button>
                    ))}
                    {dayTasks.length > 3 ? <span className="calendar-day__more">+{dayTasks.length - 3}</span> : null}
                    {dayTasks.length === 0 ? <span className="calendar-day__empty">Создать задачу</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </Modal>
  );
}

export function PortalDashboardPage() {
  const dispatch = useAppDispatch();
  const activeView = useAppSelector((state) => state.portal.activeView);
  const { data: session, isLoading: isSessionLoading } = useGetSessionQuery();
  const isAuthenticated = Boolean(session?.user);
  const { data, isLoading: isContentLoading } = useGetContentQuery(undefined, {
    skip: !isAuthenticated
  });
  const [modal, setModal] = useState<PortalModal>(null);
  const [calendarStackModal, setCalendarStackModal] = useState<CalendarStackModal>(null);
  const [selectedTask, setSelectedTask] = useState<ContentTask | undefined>();
  const [taskInitialDate, setTaskInitialDate] = useState(todayIso);
  const page = data?.pages[activeView];
  const currentUser = data?.currentUser ?? session?.user;

  useEffect(() => {
    if (!selectedTask || !data?.tasks) {
      return;
    }

    const freshTask = data.tasks.find((task) => task.id === selectedTask.id);

    if (freshTask && freshTask !== selectedTask) {
      setSelectedTask(freshTask);
    }
  }, [data?.tasks, selectedTask]);

  function openTaskDetails(task: ContentTask) {
    setSelectedTask(task);
    if (modal === "calendar") {
      setCalendarStackModal("taskDetails");
      return;
    }

    setModal("taskDetails");
  }

  function openTaskCreate(date = todayIso) {
    setTaskInitialDate(date);
    if (modal === "calendar") {
      setCalendarStackModal("task");
      return;
    }

    setModal("task");
  }

  function handleAction(index: number) {
    if (activeView === "profile") {

      if (index === 1 && currentUser) {
        printEmployeeCardPdf(currentUser);
        return;
      }

      setModal("profile");
      return;
    }

    if (index === 1) {
      setCalendarStackModal(null);
      setModal("calendar");
      return;
    }

    if (activeView === "settings") {
      setModal("settings");
      return;
    }

    openTaskCreate();
  }

  function handleCardAction(index: number) {
    if (activeView === "layout") {
      if (index === 0) {
        const nextTask = data?.tasks.find((task) => task.status !== "Готово") ?? data?.tasks[0];

        if (nextTask) {
          openTaskDetails(nextTask);
        } else {
          openTaskCreate();
        }

        return;
      }

      if (index === 1 || index === 2) {
        setCalendarStackModal(null);
        setModal("calendar");
        return;
      }

      dispatch(setActiveView("profile"));
      return;
    }

    if (activeView === "profile") {
      if (index === 1) {
        const nextTask = data?.tasks.find((task) => task.status !== "Готово") ?? data?.tasks[0];

        if (nextTask) {
          openTaskDetails(nextTask);
          return;
        }
      }

      setModal("profile");
      return;
    }

    setModal("settings");
  }

  return (
    <PortalLayout>
      <div className="mockup">
        {isSessionLoading ? <Loader label="Проверка сессии" /> : null}
        {!isSessionLoading && isAuthenticated && isContentLoading ? <Loader label="Загрузка портала" /> : null}
        {!isSessionLoading && isAuthenticated && data && page && currentUser ? (
          <div className="mockup__view" key={activeView}>
            <ProductPage
              onAction={handleAction}
              onCardAction={handleCardAction}
              onOpenTask={openTaskDetails}
              page={page}
              tasks={data.tasks}
              user={currentUser}
            />
          </div>
        ) : null}
      </div>
      <TaskModal initialDate={taskInitialDate} onClose={() => setModal(null)} open={modal === "task"} />
      <TaskDetailsModal onClose={() => setModal(null)} open={modal === "taskDetails"} task={selectedTask} />
      {currentUser ? <ProfileModal onClose={() => setModal(null)} open={modal === "profile"} user={currentUser} /> : null}
      <SettingsModal onClose={() => setModal(null)} open={modal === "settings"} />
      <CalendarModal
        onCreateTask={openTaskCreate}
        onClose={() => {
          if (calendarStackModal) {
            setCalendarStackModal(null);
            return;
          }

          setCalendarStackModal(null);
          setModal(null);
        }}
        onOpenTask={openTaskDetails}
        open={modal === "calendar"}
        tasks={data?.tasks ?? []}
      />
      <TaskModal
        initialDate={taskInitialDate}
        layer="stacked"
        onClose={() => setCalendarStackModal(null)}
        open={modal === "calendar" && calendarStackModal === "task"}
      />
      <TaskDetailsModal
        layer="stacked"
        onClose={() => setCalendarStackModal(null)}
        open={modal === "calendar" && calendarStackModal === "taskDetails"}
        task={selectedTask}
      />
    </PortalLayout>
  );
}
