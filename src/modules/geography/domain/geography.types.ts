export interface District {
  id: number;
  code: string;
  label: string;
  regionId: number;
}

export interface Commune {
  id: number;
  code: string;
  label: string;
  districtId: number;
}

export interface Fokontany {
  id: number;
  code: string;
  label: string;
  communeId: number;
}