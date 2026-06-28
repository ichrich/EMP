import type { TableHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";
import "./table.css";

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="table-wrap">
      <table className={cn("table", className)} {...props} />
    </div>
  );
}
