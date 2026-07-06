"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, type MouseEvent } from "react";
import { Button } from "@/shared/ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleToggleTheme(event: MouseEvent<HTMLButtonElement>) {
    const root = document.documentElement;
    const rect = event.currentTarget.getBoundingClientRect();

    root.style.setProperty("--theme-x", `${rect.left + rect.width / 2}px`);
    root.style.setProperty("--theme-y", `${rect.top + rect.height / 2}px`);
    root.classList.add("theme-transitioning");
    window.setTimeout(() => root.classList.remove("theme-transitioning"), 520);
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <Button aria-label="Переключить тему" onClick={handleToggleTheme} size="icon" variant="outline">
      {mounted && isDark ? <Sun size={16} /> : <Moon size={16} />}
    </Button>
  );
}
