import type { PortalView } from "@/features/portal-preferences/model/portal-slice";

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
  status: "Новая" | "В работе" | "На проверке" | "Готово";
  priority: "Низкий" | "Средний" | "Высокий";
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
  priority: ContentTask["priority"];
  dueDate: string;
};

export type UpdateProfileRequest = {
  name: string;
  role: string;
  department: string;
  location: string;
  status: string;
};
