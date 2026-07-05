"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGetSessionQuery, useLogoutMutation } from "@/entities/auth/api/auth-api";
import { setActiveView } from "@/features/portal-preferences/model/portal-slice";
import { ThemeToggle } from "@/features/theme-toggle";
import { useAppDispatch } from "@/shared/hooks/redux";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { SidebarNav } from "@/widgets/sidebar/sidebar";
import "./header.css";

export function Header() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: session, isLoading } = useGetSessionQuery();
  const [logout, logoutState] = useLogoutMutation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = session?.user;

  async function handleLogout() {
    await logout().unwrap();
    router.replace("/login");
    router.refresh();
  }

  function openProfile() {
    dispatch(setActiveView("profile"));
  }

  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__logo-slot">{/* <span className="header__logo">EMP</span> */}</div>
        <div>
          <h1 className="header__title">Портал</h1>
          <p className="header__subtitle">Сотрудники и задачи</p>
        </div>
      </div>
      <div className="header__actions">
        <ThemeToggle />
        {user ? (
          <>
            <Button onClick={openProfile} type="button" variant="ghost">
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
      <Dialog.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <Dialog.Trigger asChild>
          <Button className="header__menu-button" size="icon" variant="outline" aria-label="Открыть меню">
            <Menu size={18} />
          </Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="mobile-menu__overlay" />
          <Dialog.Content className="mobile-menu__content">
            <div className="mobile-menu__header">
              <div className="mobile-menu__brand">
                <div className="header__logo-slot">{/* <span className="header__logo">EMP</span> */}</div>
                <div>
                  <Dialog.Title className="mobile-menu__title">Портал</Dialog.Title>
                  <Dialog.Description className="mobile-menu__description">Навигация портала</Dialog.Description>
                </div>
              </div>
              <Dialog.Close asChild>
                <Button size="icon" variant="ghost" aria-label="Закрыть меню">
                  <X size={18} />
                </Button>
              </Dialog.Close>
            </div>
            <SidebarNav onNavigate={() => setMobileMenuOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  );
}
