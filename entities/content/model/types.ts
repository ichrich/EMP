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
