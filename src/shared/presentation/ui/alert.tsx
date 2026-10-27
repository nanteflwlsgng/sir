import type { ReactNode } from "react";
import { cn } from "../cn";

type Variant = "info" | "success" | "warning" | "danger";

const variants: Record<Variant, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-red-200 bg-red-50 text-red-900",
};

interface AlertProps {
  variant?: Variant;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Alert({ variant = "info", title, children, className }: AlertProps) {
  return (
    <div role="status" className={cn("rounded-lg border px-4 py-3 text-sm", variants[variant], className)}>
      {title ? <p className="mb-0.5 font-semibold">{title}</p> : null}
      <div className="text-[13px] leading-relaxed">{children}</div>
    </div>
  );
}
