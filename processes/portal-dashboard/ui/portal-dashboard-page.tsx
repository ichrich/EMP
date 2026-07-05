"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useGetSessionQuery } from "@/entities/auth/api/auth-api";
import {
  useCreateTaskMutation,
  useGetContentQuery,
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

type PortalModal = "task" | "profile" | "settings" | null;

function TaskList({ tasks }: { tasks: ContentTask[] }) {
  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div className="task-card" key={task.id}>
          <div className="task-card__header">
            <div>
              <h3 className="task-card__title">{task.title}</h3>
              <p className="task-card__description">{task.description}</p>
            </div>
            <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
          </div>
          <div className="task-card__meta">
            <Badge tone={statusTone[task.status]}>{task.status}</Badge>
            <span>{task.dueDate}</span>
            <span>{task.owner}</span>
          </div>
        </div>
      ))}
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

function ProductPage({
  onPrimaryAction,
  page,
  tasks,
  user
}: {
  onPrimaryAction: () => void;
  page: ContentPage;
  tasks: ContentTask[];
  user: ContentUser;
}) {
  const [primarySection, secondarySection] = page.sections;

  return (
    <>
      <section className="mockup__hero">
        <div>
          <h2 className="mockup__title">{page.title}</h2>
          <p className="mockup__description">{page.description}</p>
        </div>
        <div className="mockup__actions">
          {page.actions.map((action, index) => (
            <Button
              key={action}
              onClick={index === 0 ? onPrimaryAction : undefined}
              variant={index === 0 ? "primary" : "outline"}
            >
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

      <section className="mockup__workspace">
        <Card className="mockup-panel mockup-panel--large">
          <CardContent>
            <div className="mockup-panel__header">
              <span>{primarySection?.title ?? "Задачи"}</span>
              <Badge tone="info">{tasks.length} задач</Badge>
            </div>
            <p className="mockup-panel__text">{primarySection?.text}</p>
            <TaskList tasks={tasks} />
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
        priority: String(form.get("priority") ?? "Средний") as ContentTask["priority"],
        dueDate: String(form.get("dueDate") ?? "")
      }).unwrap();
      onClose();
    } catch {
      setError("Войдите в систему и проверьте данные задачи");
    }
  }

  return (
    <Modal
      description="Добавьте задачу в локальную SQLite-базу."
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
        <Field label="Приоритет">
          <select className="input" defaultValue="Средний" name="priority">
            <option>Низкий</option>
            <option>Средний</option>
            <option>Высокий</option>
          </select>
        </Field>
        <Field label="Срок">
          <Input name="dueDate" placeholder="Сегодня" required />
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
  return (
    <Modal
      description="Настройки интерфейса и уведомлений для текущей сессии."
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      open={open}
      title="Настройки портала"
    >
      <form
        className="product-form"
        onSubmit={(event) => {
          event.preventDefault();
          onClose();
        }}
      >
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
        <div className="product-form__actions">
          <Button type="submit">Сохранить</Button>
        </div>
      </form>
    </Modal>
  );
}

export function PortalDashboardPage() {
  const router = useRouter();
  const activeView = useAppSelector((state) => state.portal.activeView);
  const { data: session, isLoading: isSessionLoading } = useGetSessionQuery();
  const isAuthenticated = Boolean(session?.user);
  const { data, isLoading: isContentLoading } = useGetContentQuery(undefined, {
    skip: !isAuthenticated
  });
  const [modal, setModal] = useState<PortalModal>(null);
  const page = data?.pages[activeView];
  const currentUser = data?.currentUser ?? session?.user;

  useEffect(() => {
    if (!isSessionLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isSessionLoading, router]);

  function handlePrimaryAction() {
    if (activeView === "profile") {
      setModal("profile");
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
          <ProductPage onPrimaryAction={handlePrimaryAction} page={page} tasks={data.tasks} user={currentUser} />
        ) : null}
      </div>
      <TaskModal onClose={() => setModal(null)} open={modal === "task"} />
      {currentUser ? <ProfileModal onClose={() => setModal(null)} open={modal === "profile"} user={currentUser} /> : null}
      <SettingsModal onClose={() => setModal(null)} open={modal === "settings"} />
    </PortalLayout>
  );
}
