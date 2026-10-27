import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SIR · Reboisement",
    template: "%s · SIR Reboisement",
  },
  description:
    "Système d'Information sur le Reboisement — Ministère de l'Environnement et du Développement Durable, Madagascar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-dvh bg-zinc-50 text-zinc-900 antialiased">{children}</body>
    </html>
  );
}
