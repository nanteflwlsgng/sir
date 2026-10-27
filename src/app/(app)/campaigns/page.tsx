import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/shared/auth/guards";

export const metadata: Metadata = {
  title: "Campagnes",
};

export default async function CampaignsPage() {
  const user = await requireAdmin();

  // Pour l'instant, retourner une page vide, l'implémentation réelle sera faite plus tard
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Campagnes</h1>
        <button
          onClick={() => {}}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Nouvelle Campagne
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Gestion des campagnes - implémentation à venir</p>
        <p className="text-sm text-gray-500 mt-2">
          Connecté en tant qu'administrateur : {user.username}
        </p>
      </div>
    </div>
  );
}