"use client";

import { useState, type FormEvent } from "react";
import { useLoginMutation, useRegisterMutation } from "@/entities/auth/api/auth-api";
import { Button } from "@/shared/ui/button";
import { Field, Input } from "@/shared/ui/input";
import { Modal } from "@/shared/ui/modal";
import "./auth-modal.css";

type AuthModalProps = {
  mode: "login" | "register";
  onClose: () => void;
  open: boolean;
};

export function AuthModal({ mode, onClose, open }: AuthModalProps) {
  const [login, loginState] = useLoginMutation();
  const [register, registerState] = useRegisterMutation();
  const [error, setError] = useState("");
  const isRegister = mode === "register";
  const isLoading = loginState.isLoading || registerState.isLoading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "");

    try {
      if (isRegister) {
        await register({ email, name, password }).unwrap();
      } else {
        await login({ email, password }).unwrap();
      }
      onClose();
    } catch {
      setError(isRegister ? "Не удалось зарегистрироваться" : "Не удалось войти");
    }
  }

  return (
    <Modal
      description={isRegister ? "Создайте учетную запись EMP." : "Войдите, чтобы открыть рабочий портал."}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      open={open}
      title={isRegister ? "Регистрация" : "Вход"}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {isRegister ? (
          <Field label="Имя">
            <Input autoComplete="name" name="name" placeholder="Иван Иванов" required />
          </Field>
        ) : null}
        <Field label="Email">
          <Input autoComplete="email" name="email" placeholder="alexey.morozov@emp.local" required type="email" />
        </Field>
        <Field label="Пароль">
          <Input
            autoComplete={isRegister ? "new-password" : "current-password"}
            name="password"
            minLength={6}
            placeholder="password123"
            required
            type="password"
          />
        </Field>
        {error ? <p className="auth-form__error">{error}</p> : null}
        <div className="auth-form__hint">
          Тестовый вход: alexey.morozov@emp.local / password123
        </div>
        <div className="auth-form__actions">
          <Button disabled={isLoading} type="submit">
            {isRegister ? "Зарегистрироваться" : "Войти"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
