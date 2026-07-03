import { AuthPage } from "@/features/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserBySessionToken, sessionCookieName } from "@/shared/lib/server/content-db";

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const user = getUserBySessionToken(cookieStore.get(sessionCookieName)?.value);

  if (user) {
    redirect("/");
  }

  return <AuthPage mode="register" />;
}
