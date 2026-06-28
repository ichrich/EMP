export type EmployeeStatus = "Доступен" | "Удаленно" | "В отпуске" | "Фокус";

export type Employee = {
  id: string;
  name: string;
  role: string;
  department: string;
  location: string;
  status: EmployeeStatus;
  utilization: number;
  initials: string;
};

export type Approval = {
  id: string;
  employee: string;
  type: string;
  submitted: string;
  risk: "Низкий" | "Средний" | "Высокий";
};

export type PortalSummary = {
  currentEmployee: Employee;
  employees: Employee[];
  approvals: Approval[];
  stats: {
    label: string;
    value: string;
    delta: string;
    tone: "info" | "success" | "warning" | "danger";
  }[];
};
