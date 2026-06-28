import { useMemo, useState } from "react";
import type { Employee, EmployeeStatus } from "@/entities/employee/model/types";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge, type BadgeProps } from "@/shared/ui/badge";
import { Pagination } from "@/shared/ui/pagination";
import { Table } from "@/shared/ui/table";
import "./employee-table.css";

const statusTone: Record<EmployeeStatus, BadgeProps["tone"]> = {
  Доступен: "success",
  Удаленно: "info",
  "В отпуске": "warning",
  Фокус: "neutral"
};

type EmployeeTableProps = {
  employees: Employee[];
};

export function EmployeeTable({ employees }: EmployeeTableProps) {
  const [page, setPage] = useState(1);
  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(employees.length / pageSize));
  const pageEmployees = useMemo(
    () => employees.slice((page - 1) * pageSize, page * pageSize),
    [employees, page]
  );

  return (
    <>
      <Table>
        <thead>
          <tr>
            <th>Сотрудник</th>
            <th>Отдел</th>
            <th>Локация</th>
            <th>Статус</th>
            <th>Загрузка</th>
          </tr>
        </thead>
        <tbody>
          {pageEmployees.map((employee) => (
            <tr key={employee.id}>
              <td>
                <div className="employee-table__person">
                  <Avatar>
                    <AvatarFallback>{employee.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="employee-table__name">{employee.name}</p>
                    <p className="employee-table__role">{employee.role}</p>
                  </div>
                </div>
              </td>
              <td>{employee.department}</td>
              <td>{employee.location}</td>
              <td>
                <Badge tone={statusTone[employee.status]}>{employee.status}</Badge>
              </td>
              <td>
                <div className="employee-table__meter" aria-label={`${employee.utilization}%`}>
                  <span style={{ width: `${employee.utilization}%` }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  );
}
