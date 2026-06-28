import type { ReactNode } from "react";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { Sidebar } from "@/widgets/sidebar";
import "./portal-layout.css";

type PortalLayoutProps = {
  children: ReactNode;
};

export function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <div className="portal-layout">
      <Sidebar />
      <div className="portal-layout__main">
        <Header />
        <main className="portal-layout__content">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
