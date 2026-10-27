"use client";

import { useState, useEffect } from "react";
import { Campaign, CampaignListItem } from "../domain/campaign";
import { CampaignStatusBadge } from "./campaign-status-badge";

interface CampaignsTableProps {
  initialData: CampaignListItem[];
  onCampaignUpdated?: (campaign: Campaign) => void;
}

export function CampaignsTable({ initialData, onCampaignUpdated }: CampaignsTableProps) {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/campaigns");
      if (!response.ok) {
        throw new Error("Failed to fetch campaigns");
      }
      const data = await response.json();
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCampaigns();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Campagnes</h2>
        <button
          onClick={() => window.location.href = "/campaigns/new"}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Nouvelle Campagne
        </button>
      </div>

      {loading && <div className="text-center py-4">Chargement...</div>}
      {error && <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>}

      {!loading && campaigns.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Aucune campagne trouvée
        </div>
      )}

      {!loading && campaigns.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {campaign.label}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.startsOn.toLocaleDateString()} - {campaign.endsOn.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <CampaignStatusBadge status={campaign.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => window.location.href = `/campaigns/${campaign.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Voir
                    </button>
                    <button
                      onClick={() => window.location.href = `/campaigns/${campaign.id}/edit`}
                      className="text-gray-600 hover:text-gray-900 mr-3"
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}