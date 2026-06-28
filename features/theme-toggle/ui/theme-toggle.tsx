"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Button
      aria-label="Переключить тему"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      size="icon"
      variant="outline"
    >
      {mounted && isDark ? <Sun size={16} /> : <Moon size={16} />}
    </Button>
  );
}
