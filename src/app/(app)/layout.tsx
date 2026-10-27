import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/shared/auth/guards";
import { MainNav, type NavItem } from "@/shared/presentation/main-nav";
import { LogoutButton } from "@/modules/auth/presentation/logout-button";
import { displayName, userScopeLabel } from "@/modules/auth/domain/account";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  const navItems: NavItem[] = [{ href: "/tableau-de-bord", label: "Tableau de bord" }];
  if (user.role.rank >= 50) {
    navItems.push({ href: "/administration/acteurs", label: "Acteurs" });
  }
  if (user.role.code === "admin") {
    navItems.push({ href: "/administration/utilisateurs", label: "Utilisateurs" });
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/tableau-de-bord" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-emerald-900 text-xs font-bold text-white">
              SIR
            </span>
            <span className="hidden sm:block">
              <span className="block text-sm font-semibold leading-tight text-zinc-900">
                Reboisement
              </span>
              <span className="block text-[11px] leading-tight text-zinc-500">Madagascar</span>
            </span>
          </Link>

          <MainNav items={navItems} />

          <div className="ml-auto hidden items-center gap-3 sm:flex">
            <div className="text-right">
              <p className="text-xs font-semibold text-zinc-900">{displayName(user)}</p>
              <p className="text-[11px] text-zinc-500">{user.role.label}</p>
            </div>
            <Link
              href="/mon-compte"
              className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Mon compte
            </Link>
            <LogoutButton />
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 border-t border-zinc-100 px-4 py-2 sm:hidden">
          <p className="truncate text-[11px] text-zinc-500">
            {displayName(user)} · {user.role.label}
          </p>
          <div className="flex items-center gap-2">
            <Link href="/mon-compte" className="text-xs font-medium text-zinc-600">
              Mon compte
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 text-[11px] text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>MEDD · Système d&apos;Information sur le Reboisement</p>
          <p className="truncate">{userScopeLabel(user)}</p>
        </div>
      </footer>
    </div>
  );
}
