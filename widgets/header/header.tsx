"use client";

import { ThemeToggle } from "@/features/theme-toggle";
import { Button } from "@/shared/ui/button";
import "./header.css";

export function Header() {
  return (
    <header className="header">
      <div>
        <h1 className="header__title">EMP</h1>
        <p className="header__subtitle">Описание</p>
      </div>
      <div className="header__actions">
        <ThemeToggle />
        <Button variant="outline">Кнопка</Button>
      </div>
    </header>
  );
}
