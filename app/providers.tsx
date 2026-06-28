"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "@/app/store";
import { ToastProvider, ToastViewport } from "@/shared/ui/toast";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <ToastProvider swipeDirection="right">
          {children}
          <ToastViewport />
        </ToastProvider>
      </ThemeProvider>
    </Provider>
  );
}
