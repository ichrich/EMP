"use client";

import { LayoutDashboard, Settings, UserRound } from "lucide-react";
import { setActiveView, type PortalView } from "@/features/portal-preferences/model/portal-slice";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/redux";
import "./sidebar.css";

const navItems: Array<{ id: PortalView; label: string; icon: typeof LayoutDashboard }> = [
  { id: "layout", label: "Рабочий стол", icon: LayoutDashboard },
  { id: "profile", label: "Профиль", icon: UserRound },
  { id: "settings", label: "Настройки", icon: Settings }
];

export function Sidebar() {
  const dispatch = useAppDispatch();
  const activeView = useAppSelector((state) => state.portal.activeView);

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">EMP</span>
        <p className="sidebar__name">Портал</p>
      </div>
      <nav className="sidebar__nav" aria-label="Навигация">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeView;

          return (
            <button
              className={active ? "sidebar__link sidebar__link--active" : "sidebar__link"}
              key={item.id}
              onClick={() => dispatch(setActiveView(item.id))}
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
