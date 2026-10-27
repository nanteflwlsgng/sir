import type { ActeurStatus } from "@/modules/auth/domain/account";

/** Types d'acteur proposés à la création (référentiel dédié prévu en migration suivante). */
export const ACTEUR_TYPES = [
  "INSTITUTION PUBLIQUE",
  "DIREDD/DREDD/CIREDD",
  "ONG",
  "ASSOCIATION",
  "VOI",
  "PROJET/PROGRAMME",
  "ENTREPRISE PRIVEE",
  "COOPERATIVE",
] as const;

export type ActeurType = (typeof ACTEUR_TYPES)[number];

export interface ActeurListItem {
  id: number;
  abbreviation: string;
  name: string;
  type: string;
  status: ActeurStatus;
  rejectionReason: string | null;
  siteLabel: string;
  regionLabel: string;
  userCount: number;
  createdAt: Date;
  validatedAt: Date | null;
}

export interface SiteOption {
  id: number;
  code: string;
  label: string;
  kind: string;
}

export interface CreateActeurInput {
  abbreviation: string;
  name: string;
  type: string;
  siteId: number;
}

export interface ActeurAdminRepository {
  list(status: ActeurStatus | "tous"): Promise<ActeurListItem[]>;
  listSites(): Promise<SiteOption[]>;
  create(input: CreateActeurInput, actorId: string): Promise<{ id: number }>;
  findStatus(id: number): Promise<ActeurStatus | null>;
  setStatus(
    id: number,
    status: ActeurStatus,
    validatedBy: string,
    rejectionReason: string | null,
  ): Promise<void>;
  findConflict(abbreviation: string, name: string): Promise<"abbreviation" | "name" | null>;
}
