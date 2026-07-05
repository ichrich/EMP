"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useGetSessionQuery,
  useLogoutMutation
} from "@/entities/auth/api/auth-api";
import { ThemeToggle } from "@/features/theme-toggle";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import "./header.css";

export function Header() {
  const router = useRouter();
  const { data: session, isLoading } = useGetSessionQuery();
  const [logout, logoutState] = useLogoutMutation();
  const user = session?.user;

  async function handleLogout() {
    await logout().unwrap();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="header">
      <div>
        <h1 className="header__title">EMP</h1>
        <p className="header__subtitle">Портал сотрудников</p>
      </div>
      <div className="header__actions">
        <ThemeToggle />
        {user ? (
          <>
            <Button variant="ghost">
              <Avatar>
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              {user.name}
            </Button>
            <Button disabled={logoutState.isLoading} onClick={() => void handleLogout()} variant="outline">
              Выйти
            </Button>
          </>
        ) : !isLoading ? (
          <>
            <Button asChild variant="outline">
              <Link href="/login">Войти</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Регистрация</Link>
            </Button>
          </>
        ) : null}
      </div>
    </header>
  );
}
