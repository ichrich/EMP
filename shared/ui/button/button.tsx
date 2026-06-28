import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";
import "./button.css";

const buttonVariants = cva("button", {
  variants: {
    variant: {
      primary: "button--primary",
      secondary: "button--secondary",
      outline: "button--outline",
      ghost: "button--ghost",
      destructive: "button--destructive"
    },
    size: {
      sm: "button--sm",
      md: "",
      lg: "button--lg",
      icon: "button--icon"
    }
  },
  defaultVariants: {
    variant: "primary",
    size: "md"
  }
});

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ asChild, className, size, variant, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ size, variant }), className)} {...props} />;
}
