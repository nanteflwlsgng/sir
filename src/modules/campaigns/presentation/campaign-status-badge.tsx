"use client";

import type { CampaignStatus } from "../domain/campaign";

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
}

export function CampaignStatusBadge({ status }: CampaignStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "preparee":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          label: "Préparée",
          icon: "⏳",
        };
      case "active":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          label: "Active",
          icon: "✅",
        };
      case "cloturee":
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          label: "Clôturée",
          icon: "🏁",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          label: status,
          icon: "❓",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
}