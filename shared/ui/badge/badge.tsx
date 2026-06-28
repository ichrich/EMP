import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";
import "./badge.css";

const badgeVariants = cva("badge", {
  variants: {
    tone: {
      neutral: "badge--neutral",
      info: "badge--info",
      success: "badge--success",
      warning: "badge--warning",
      danger: "badge--danger"
    }
  },
  defaultVariants: {
    tone: "neutral"
  }
});

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
