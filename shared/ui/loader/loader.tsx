import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";
import "./loader.css";

type LoaderProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
};

export function Loader({ className, label = "Загрузка", ...props }: LoaderProps) {
  return (
    <div className={cn("loader", className)} role="status" {...props}>
      <span className="loader__spinner" />
      <span>{label}</span>
    </div>
  );
}
