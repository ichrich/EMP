"use client";

import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, Download, SlidersHorizontal, Trash2 } from "lucide-react";
import { useGetSessionQuery } from "@/entities/auth/api/auth-api";
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetContentQuery,
  useUpdateTaskMutation,
  useUpdateProfileMutation
} from "@/entities/content/api/content-api";
import type { ContentPage, ContentTask, ContentUser } from "@/entities/content/model/types";
import { useAppSelector } from "@/shared/hooks/redux";
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
type TaskSort = "dueDate" | "priority" | "status";

const todayIso = "2026-07-06";

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
  return date.toISOString().slice(0, 10);
}

function isWeekend(value: string) {
  const day = new Date(`${value}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

function buildMonthDays(monthIso: string) {
  const monthDate = new Date(`${monthIso}-01T00:00:00`);
  const monthStart = monthDate.toISOString().slice(0, 10);
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

function buildEmployeeCard(user: ContentUser) {
  return [
    "EMP. Карточка сотрудника",
    "",
    `Имя: ${user.name}`,
    `Роль: ${user.role}`,
    `Отдел: ${user.department}`,
    `Email: ${user.email}`,
    `Локация: ${user.location}`,
    `Статус: ${user.status}`
  ].join("\n");
}

function downloadTextFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
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
        <label className="tracker__select">
          <SlidersHorizontal size={16} />
          <select onChange={(event) => setSort(event.target.value as TaskSort)} value={sort}>
            <option value="dueDate">По сроку</option>
            <option value="priority">По срочности</option>
            <option value="status">По статусу</option>
          </select>
        </label>
        <div className="tracker__summary">
          <CalendarDays size={16} />
          <span>{filteredTasks.length} задач</span>
        </div>
      </div>

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
  onOpenTask,
  page,
  tasks,
  user
}: {
  onAction: (index: number) => void;
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
        {page.cards.map((card) => (
          <Card className="mockup-card" key={card.title}>
            <CardContent>
              <div className="mockup-card__label">{card.title}</div>
              <p className="mockup-card__text">{card.text}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <WorkspaceContent onOpenTask={onOpenTask} page={page} tasks={tasks} user={user} />
    </>
  );
}

function TaskModal({ onClose, open }: { onClose: () => void; open: boolean }) {
  const [createTask, createTaskState] = useCreateTaskMutation();
  const [error, setError] = useState("");

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
      description="Укажите период выполнения: дата начала и дата завершения будут использоваться для сортировки."
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
            <Input defaultValue={todayIso} name="startDate" required type="date" />
          </Field>
          <Field label="Дата завершения">
            <Input defaultValue={todayIso} name="dueDate" required type="date" />
          </Field>
        </div>
        <Field label="Срочность">
          <select className="input" defaultValue="medium" name="priority">
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
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
  onClose,
  open,
  task
}: {
  onClose: () => void;
  open: boolean;
  task?: ContentTask;
}) {
  const [updateTask, updateTaskState] = useUpdateTaskMutation();
  const [deleteTask, deleteTaskState] = useDeleteTaskMutation();

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
      description="Просмотрите задачу и измените ее состояние."
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
            onClick={() => void handleDelete()}
            type="button"
            variant="destructive"
          >
            <Trash2 size={16} />
            Удалить
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ProfileModal({ onClose, open, user }: { onClose: () => void; open: boolean; user: ContentUser }) {
  const [updateProfile, updateProfileState] = useUpdateProfileMutation();
  const [error, setError] = useState("");

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
          <Input defaultValue={user.status} name="status" required />
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
          <select className="input" defaultValue="Все события" name="notifications">
            <option>Все события</option>
            <option>Только важные</option>
            <option>Отключить</option>
          </select>
        </Field>
        <Field label="Рабочий режим">
          <select className="input" defaultValue="Операционный" name="mode">
            <option>Операционный</option>
            <option>Фокус</option>
            <option>Руководитель</option>
          </select>
        </Field>
          <Field label="Плотность списка">
          <select className="input" defaultValue="Комфортная" name="density">
            <option>Компактная</option>
            <option>Комфортная</option>
            <option>Свободная</option>
          </select>
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
  onClose,
  onOpenTask,
  open,
  tasks
}: {
  onClose: () => void;
  onOpenTask: (task: ContentTask) => void;
  open: boolean;
  tasks: ContentTask[];
}) {
  const [monthIso, setMonthIso] = useState(todayIso.slice(0, 7));
  const monthDays = useMemo(() => buildMonthDays(monthIso), [monthIso]);
  const monthLabel = new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric"
  }).format(new Date(`${monthIso}-01T00:00:00`));
  const warningTasks = tasks.filter(
    (task) => task.status !== "Готово" && (daysUntil(task.dueDate) <= 2 || isWeekend(task.startDate) || isWeekend(task.dueDate))
  );

  function handleMonthShift(direction: -1 | 1) {
    const date = new Date(`${monthIso}-01T00:00:00`);
    date.setMonth(date.getMonth() + direction);
    setMonthIso(date.toISOString().slice(0, 7));
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
                  onClick={() => {
                    onOpenTask(task);
                    onClose();
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
            <strong>{monthLabel}</strong>
            <Button onClick={() => handleMonthShift(1)} type="button" variant="outline">
              Вперед
            </Button>
          </div>
          <div className="calendar-month__weekdays">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-month__grid">
            {monthDays.map((day) => {
              const dayTasks = tasks.filter((task) => task.startDate <= day && task.dueDate >= day);
              const outsideMonth = !day.startsWith(monthIso);
              const weekend = isWeekend(day);

              return (
                <div
                  className={[
                    "calendar-day",
                    outsideMonth ? "calendar-day--muted" : "",
                    weekend ? "calendar-day--weekend" : "",
                    day === todayIso ? "calendar-day--today" : ""
                  ].filter(Boolean).join(" ")}
                  key={day}
                >
                  <div className="calendar-day__number">
                    <span>{new Date(`${day}T00:00:00`).getDate()}</span>
                    {weekend ? <Badge tone="warning">выходной</Badge> : null}
                  </div>
                  <div className="calendar-day__tasks">
                    {dayTasks.slice(0, 3).map((task) => (
                      <button
                        className={`calendar-task calendar-task--${
                          task.priority === "Высокий" ? "high" : task.priority === "Средний" ? "medium" : "low"
                        }`}
                        key={task.id}
                        onClick={() => {
                          onOpenTask(task);
                          onClose();
                        }}
                        type="button"
                      >
                        {daysUntil(task.dueDate) <= 2 && task.status !== "Готово" ? <AlertTriangle size={12} /> : null}
                        <span>{task.title}</span>
                      </button>
                    ))}
                    {dayTasks.length > 3 ? <span className="calendar-day__more">+{dayTasks.length - 3}</span> : null}
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
  const activeView = useAppSelector((state) => state.portal.activeView);
  const { data: session, isLoading: isSessionLoading } = useGetSessionQuery();
  const isAuthenticated = Boolean(session?.user);
  const { data, isLoading: isContentLoading } = useGetContentQuery(undefined, {
    skip: !isAuthenticated
  });
  const [modal, setModal] = useState<PortalModal>(null);
  const [selectedTask, setSelectedTask] = useState<ContentTask | undefined>();
  const page = data?.pages[activeView];
  const currentUser = data?.currentUser ?? session?.user;

  function openTaskDetails(task: ContentTask) {
    setSelectedTask(task);
    setModal("taskDetails");
  }

  function handleAction(index: number) {
    if (activeView === "profile") {

      if (index === 1 && currentUser) {
        downloadTextFile(`employee-card-${currentUser.id}.txt`, buildEmployeeCard(currentUser));
        return;
      }

      setModal("profile");
      return;
    }

    if (index === 1) {
      setModal("calendar");
      return;
    }

    if (activeView === "settings") {
      setModal("settings");
      return;
    }

    setModal("task");
  }

  return (
    <PortalLayout>
      <div className="mockup">
        {isSessionLoading ? <Loader label="Проверка сессии" /> : null}
        {!isSessionLoading && isAuthenticated && isContentLoading ? <Loader label="Загрузка портала" /> : null}
        {!isSessionLoading && isAuthenticated && data && page && currentUser ? (
          <ProductPage onAction={handleAction} onOpenTask={openTaskDetails} page={page} tasks={data.tasks} user={currentUser} />
        ) : null}
      </div>
      <TaskModal onClose={() => setModal(null)} open={modal === "task"} />
      <TaskDetailsModal onClose={() => setModal(null)} open={modal === "taskDetails"} task={selectedTask} />
      {currentUser ? <ProfileModal onClose={() => setModal(null)} open={modal === "profile"} user={currentUser} /> : null}
      <SettingsModal onClose={() => setModal(null)} open={modal === "settings"} />
      <CalendarModal
        onClose={() => setModal(null)}
        onOpenTask={openTaskDetails}
        open={modal === "calendar"}
        tasks={data?.tasks ?? []}
      />
    </PortalLayout>
  );
}
