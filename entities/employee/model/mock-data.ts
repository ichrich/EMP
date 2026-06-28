import type { PortalSummary } from "./types";

export const portalSummary: PortalSummary = {
  currentEmployee: {
    id: "emp-001",
    name: "Алексей Морозов",
    role: "Старший продуктовый менеджер",
    department: "Продукт",
    location: "Москва, Россия",
    status: "Доступен",
    utilization: 86,
    initials: "AM"
  },
  stats: [
    { label: "Остаток отпуска", value: "18 дней", delta: "+2 начислено", tone: "success" },
    { label: "Согласования", value: "7", delta: "3 сегодня", tone: "warning" },
    { label: "Расчет зарплаты", value: "Готово", delta: "Цикл 30 июня", tone: "info" },
    { label: "Обучение", value: "94%", delta: "+6% за месяц", tone: "success" }
  ],
  approvals: [
    { id: "apr-101", employee: "Мария Чен", type: "Отпуск", submitted: "Сегодня", risk: "Низкий" },
    { id: "apr-102", employee: "Никита Патель", type: "Расходы", submitted: "Вчера", risk: "Средний" },
    { id: "apr-103", employee: "Елена Росси", type: "Оборудование", submitted: "2 дня назад", risk: "Низкий" },
    { id: "apr-104", employee: "Иван Белл", type: "Договор", submitted: "3 дня назад", risk: "Высокий" }
  ],
  employees: [
    {
      id: "emp-201",
      name: "Мария Чен",
      role: "Руководитель разработки",
      department: "Разработка",
      location: "Сингапур",
      status: "Доступен",
      utilization: 91,
      initials: "MC"
    },
    {
      id: "emp-202",
      name: "Никита Патель",
      role: "Финансовый партнер",
      department: "Финансы",
      location: "Нью-Йорк",
      status: "Удаленно",
      utilization: 74,
      initials: "NP"
    },
    {
      id: "emp-203",
      name: "Елена Росси",
      role: "Операции с персоналом",
      department: "HR",
      location: "Милан",
      status: "Фокус",
      utilization: 82,
      initials: "ER"
    },
    {
      id: "emp-204",
      name: "Иван Белл",
      role: "Юрисконсульт",
      department: "Юридический",
      location: "Остин",
      status: "В отпуске",
      utilization: 48,
      initials: "JB"
    }
  ]
};
