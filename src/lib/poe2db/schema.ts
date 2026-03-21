export type IEntitySourceType = "poe2db";

export type IPoe2DbEntityKindType =
  | "base_item"
  | "modifier"
  | "currency"
  | "essence"
  | "omen"
  | "unknown";

export type IPoe2DbEntityType = {
  id: string;
  source: IEntitySourceType;
  kind: IPoe2DbEntityKindType;
  key: string;
  name: string;
  url: string;
  tags: string[];
  patchVersion: string | null;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type IPoe2DbImportStatsType = {
  pageCount: number;
  anchorCount: number;
  entityCount: number;
};

export type IPoe2DbImportResultType = {
  source: IEntitySourceType;
  importedAt: string;
  patchVersion: string | null;
  baseUrl: string;
  pages: string[];
  stats: IPoe2DbImportStatsType;
  entities: IPoe2DbEntityType[];
};

export type IPoe2DbAnchorType = {
  href: string;
  text: string;
};
