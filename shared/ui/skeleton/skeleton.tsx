import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";
import "./skeleton.css";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton", className)} {...props} />;
}
