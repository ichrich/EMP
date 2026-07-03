import { PortalDashboardPage } from "@/processes/portal-dashboard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserBySessionToken, sessionCookieName } from "@/shared/lib/server/content-db";

export default async function HomePage() {
  const cookieStore = await cookies();
  const user = getUserBySessionToken(cookieStore.get(sessionCookieName)?.value);

  if (!user) {
    redirect("/login");
  }

  return <PortalDashboardPage />;
}
