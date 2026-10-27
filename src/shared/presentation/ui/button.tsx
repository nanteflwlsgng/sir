import type { ButtonHTMLAttributes } from "react";
import { cn } from "../cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary:
    "bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:outline-emerald-700 shadow-sm disabled:bg-emerald-700/60",
  secondary:
    "bg-white text-zinc-800 border border-zinc-300 hover:bg-zinc-50 focus-visible:outline-zinc-500 shadow-sm",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600 shadow-sm",
  ghost: "bg-transparent text-zinc-600 hover:bg-zinc-100 focus-visible:outline-zinc-400",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string): string {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-70",
    variants[variant],
    sizes[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}
