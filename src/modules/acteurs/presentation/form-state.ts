import type { ActeurField } from "../application/manage-acteurs";

export interface CreateActeurState {
  ok?: boolean;
  createdName?: string;
  fieldErrors: Partial<Record<ActeurField, string>>;
  values: { abbreviation: string; name: string; type: string; siteId: string };
}

export const INITIAL_CREATE_ACTEUR_STATE: CreateActeurState = {
  fieldErrors: {},
  values: { abbreviation: "", name: "", type: "", siteId: "" },
};
