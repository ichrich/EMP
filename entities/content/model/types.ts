import type { PortalView } from "@/features/portal-preferences/model/portal-slice";

export type TaskStatus = "Новая" | "В работе" | "На проверке" | "Готово";

export type TaskPriority = "Низкий" | "Средний" | "Высокий";

export type ContentCard = {
  title: string;
  text: string;
};

export type ContentSection = {
  title: string;
  text: string;
  variant: "large" | "default";
};

export type ContentTask = {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  owner: string;
};

export type ContentUser = {
  id: number;
  name: string;
  role: string;
  department: string;
  email: string;
  location: string;
  status: string;
  initials: string;
};

export type AuthUser = ContentUser;

export type ContentPage = {
  id: PortalView;
  title: string;
  description: string;
  actions: string[];
  cards: ContentCard[];
  sections: ContentSection[];
};

export type ContentResponse = {
  currentUser: ContentUser;
  pages: Record<PortalView, ContentPage>;
  tasks: ContentTask[];
};

export type AuthResponse = {
  user: AuthUser | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = LoginRequest & {
  name: string;
};

export type CreateTaskRequest = {
  title: string;
  description: string;
  priority: TaskPriority | "low" | "medium" | "high";
  startDate: string;
  dueDate: string;
};

export type UpdateTaskRequest = Partial<{
  title: string;
  description: string;
  status: TaskStatus | "new" | "in_progress" | "review" | "done";
  priority: TaskPriority | "low" | "medium" | "high";
  startDate: string;
  dueDate: string;
}>;

export type UpdateProfileRequest = {
  name: string;
  role: string;
  department: string;
  location: string;
  status: string;
};
