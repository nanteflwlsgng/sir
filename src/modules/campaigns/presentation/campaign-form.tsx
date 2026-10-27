"use client";

import { useState } from "react";
import { NewCampaign } from "../domain/campaign";

interface CampaignFormProps {
  initialData?: NewCampaign;
  onSubmit: (data: NewCampaign) => Promise<void>;
  isEditing?: boolean;
}

export function CampaignForm({ initialData, onSubmit, isEditing = false }: CampaignFormProps) {
  const [formData, setFormData] = useState<NewCampaign>(initialData || {
    label: "",
    startsOn: new Date(),
    endsOn: new Date(),
  });

  const [errors, setErrors] = useState<Partial<Record<keyof NewCampaign, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Une erreur est survenue" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof NewCampaign, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.form && (
        <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">
          {errors.form}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
        <input
          type="text"
          value={formData.label}
          onChange={(e) => handleChange("label", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: Campagne de plantation 2025"
        />
        {errors.label && <div className="text-red-600 text-sm mt-1">{errors.label}</div>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
          <input
            type="date"
            value={formData.startsOn.toISOString().split("T")[0]}
            onChange={(e) => handleChange("startsOn", new Date(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.startsOn && <div className="text-red-600 text-sm mt-1">{errors.startsOn}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
          <input
            type="date"
            value={formData.endsOn.toISOString().split("T")[0]}
            onChange={(e) => handleChange("endsOn", new Date(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.endsOn && <div className="text-red-600 text-sm mt-1">{errors.endsOn}</div>}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Traitement..." : isEditing ? "Mettre à jour" : "Créer"}
        </button>
      </div>
    </form>
  );
}