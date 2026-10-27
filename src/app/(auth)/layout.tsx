import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/presentation/get-current-user";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/tableau-de-bord");
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-emerald-900 px-12 py-10 text-emerald-50 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-emerald-700/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-lime-500/10 blur-3xl"
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-base font-bold text-emerald-900">
              SIR
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">SIR · Reboisement</p>
              <p className="text-xs text-emerald-200">Madagascar</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-md space-y-4">
          <h1 className="text-3xl font-semibold leading-tight">
            Piloter le reboisement national, du semis à la parcelle.
          </h1>
          <p className="text-sm leading-relaxed text-emerald-100/80">
            Planifications, réalisations, pépinières et suivi des plantations réunis dans un
            référentiel unique — au service du Ministère de l&apos;Environnement et du Développement
            Durable.
          </p>
        </div>

        <p className="relative text-[11px] text-emerald-200/70">
          Campagne 2025-2026 · Accès réservé aux agents habilités
        </p>
      </aside>

      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid size-10 place-items-center rounded-lg bg-emerald-900 text-sm font-bold text-white">
              SIR
            </div>
            <div>
              <p className="text-sm font-semibold">SIR · Reboisement</p>
              <p className="text-xs text-zinc-500">Madagascar</p>
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
