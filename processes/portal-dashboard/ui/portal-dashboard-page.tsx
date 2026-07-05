"use client";

import { useGetContentQuery } from "@/entities/content/api/content-api";
import type { ContentPage, ContentTask, ContentUser } from "@/entities/content/model/types";
import { useAppSelector } from "@/shared/hooks/redux";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge, type BadgeProps } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Loader } from "@/shared/ui/loader";
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
  page,
  tasks,
  user
}: {
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
            <Button key={action} variant={index === 0 ? "primary" : "outline"}>
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
              <Badge tone="info">{tasks.length} задачи</Badge>
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

export function PortalDashboardPage() {
  const activeView = useAppSelector((state) => state.portal.activeView);
  const { data, isLoading } = useGetContentQuery();
  const page = data?.pages[activeView];

  return (
    <PortalLayout>
      <div className="mockup">
        {isLoading ? <Loader label="Загрузка портала" /> : null}
        {!isLoading && data && page ? (
          <ProductPage page={page} tasks={data.tasks} user={data.currentUser} />
        ) : null}
      </div>
    </PortalLayout>
  );
}
