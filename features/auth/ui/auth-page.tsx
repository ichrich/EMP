"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLoginMutation, useRegisterMutation } from "@/entities/auth/api/auth-api";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Field, Input } from "@/shared/ui/input";
import "./auth-page.css";

const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов")
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Введите имя")
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

type AuthPageProps = {
  mode: "login" | "register";
};

export function AuthPage({ mode }: AuthPageProps) {
  const router = useRouter();
  const [login, loginState] = useLoginMutation();
  const [registerUser, registerState] = useRegisterMutation();
  const isRegister = mode === "register";
  const schema = isRegister ? registerSchema : loginSchema;
  const form = useForm<LoginFormValues | RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: isRegister
      ? { email: "", name: "", password: "" }
      : { email: "alexey.morozov@emp.local", password: "password123" }
  });
  const rootError = form.formState.errors.root?.message;
  const isLoading = loginState.isLoading || registerState.isLoading;

  async function handleSubmit(values: LoginFormValues | RegisterFormValues) {
    try {
      if (isRegister) {
        await registerUser(values as RegisterFormValues).unwrap();
      } else {
        await login(values as LoginFormValues).unwrap();
      }

      router.replace("/");
      router.refresh();
    } catch {
      form.setError("root", {
        message: isRegister ? "Не удалось создать учетную запись" : "Неверная почта или пароль"
      });
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-page__shell">
        <div className="auth-page__brand">
          <div className="auth-page__logo">EMP</div>
          <BadgeLine />
          <h1 className="auth-page__title">{isRegister ? "Создайте учетную запись" : "Вход в портал"}</h1>
          <p className="auth-page__text">
            {isRegister
              ? "После регистрации откроется рабочая система сотрудника."
              : "Авторизуйтесь, чтобы открыть задачи, профиль и настройки."}
          </p>
        </div>

        <Card className="auth-page__card">
          <CardContent>
            <form className="auth-page__form" onSubmit={form.handleSubmit(handleSubmit)}>
              {isRegister ? (
                <Field label="Имя">
                  <Input autoComplete="name" {...form.register("name" as keyof RegisterFormValues)} />
                  <FormError message={(form.formState.errors as Record<string, { message?: string }>).name?.message} />
                </Field>
              ) : null}

              <Field label="Email">
                <Input autoComplete="email" type="email" {...form.register("email")} />
                <FormError message={form.formState.errors.email?.message} />
              </Field>

              <Field label="Пароль">
                <Input
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  type="password"
                  {...form.register("password")}
                />
                <FormError message={form.formState.errors.password?.message} />
              </Field>

              {rootError ? <p className="auth-page__error">{rootError}</p> : null}

              <Button disabled={isLoading} type="submit">
                {isRegister ? "Зарегистрироваться" : "Войти"}
              </Button>

              <p className="auth-page__switch">
                {isRegister ? "Уже есть учетная запись?" : "Еще нет учетной записи?"}{" "}
                <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Войти" : "Зарегистрироваться"}</Link>
              </p>

              {!isRegister ? (
                <div className="auth-page__hint">Тестовый вход: alexey.morozov@emp.local / password123</div>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function FormError({ message }: { message?: string }) {
  return message ? <span className="auth-page__field-error">{message}</span> : null;
}

function BadgeLine() {
  return <div className="auth-page__badge">Enterprise Employee Portal</div>;
}
