import * as ToastPrimitive from "@radix-ui/react-toast";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/shared/lib/utils";
import "./toast.css";

export const ToastProvider = ToastPrimitive.Provider;

export function ToastViewport(props: ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>) {
  return <ToastPrimitive.Viewport className="toast__viewport" {...props} />;
}

export function Toast({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof ToastPrimitive.Root>) {
  return <ToastPrimitive.Root className={cn("toast__root", className)} {...props} />;
}

export function ToastTitle(props: ComponentPropsWithoutRef<typeof ToastPrimitive.Title>) {
  return <ToastPrimitive.Title className="toast__title" {...props} />;
}

export function ToastDescription(
  props: ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
) {
  return <ToastPrimitive.Description className="toast__description" {...props} />;
}
