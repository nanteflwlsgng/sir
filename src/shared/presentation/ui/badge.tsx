import type { ReactNode } from "react";
import { cn } from "../cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "border-zinc-200 bg-zinc-100 text-zinc-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function userStatusBadge(status: string): ReactNode {
  switch (status) {
    case "actif":
      return <Badge tone="success">Actif</Badge>;
    case "en_attente":
      return <Badge tone="warning">En attente</Badge>;
    case "suspendu":
      return <Badge tone="danger">Suspendu</Badge>;
    case "supprime":
      return <Badge tone="neutral">Supprimé</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function acteurStatusBadge(status: string): ReactNode {
  switch (status) {
    case "valide":
      return <Badge tone="success">Validé</Badge>;
    case "soumis":
      return <Badge tone="warning">Soumis</Badge>;
    case "rejete":
      return <Badge tone="danger">Rejeté</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}
