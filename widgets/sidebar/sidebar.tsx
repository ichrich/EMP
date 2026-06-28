"use client";

import { LayoutDashboard, Settings, UserRound } from "lucide-react";
import "./sidebar.css";

const navItems = [
  { label: "Пункт", icon: LayoutDashboard },
  { label: "Пункт", icon: UserRound },
  { label: "Пункт", icon: Settings }
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">EMP</span>
        <p className="sidebar__name">Заголовок</p>
      </div>
      <nav className="sidebar__nav" aria-label="Навигация">
        {navItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <button
              className={index === 0 ? "sidebar__link sidebar__link--active" : "sidebar__link"}
              key={`${item.label}-${index}`}
              type="button"
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
