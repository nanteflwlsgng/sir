export interface Species {
  id: number;
  code: string;
  label: string;
  family?: string;
  genus?: string;
  species?: string;
  status: "actif" | "inactif" | "en_revue";
}

export interface SpeciesSynonym {
  id: number;
  speciesId: number;
  synonym: string;
}