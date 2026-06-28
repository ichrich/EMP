import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import "./input.css";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return <input className={cn("input", className)} {...props} />;
}

type FieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

export function Field({ children, error, label }: FieldProps) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {error ? <p className="field__error">{error}</p> : null}
    </label>
  );
}
