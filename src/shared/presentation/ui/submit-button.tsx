"use client";

import { useFormStatus } from "react-dom";
import { cn } from "../cn";
import { buttonClasses } from "./button";

interface SubmitButtonProps {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
  title?: string;
}

/** Bouton de soumission avec état « en cours » (doit vivre dans un <form>). */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  size = "md",
  className,
  disabled,
  title,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      title={title}
      disabled={pending || disabled}
      className={cn(buttonClasses(variant, size, className))}
    >
      {pending ? (pendingLabel ?? "En cours…") : children}
    </button>
  );
}
