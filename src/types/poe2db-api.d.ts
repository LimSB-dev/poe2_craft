export {};

declare global {
  type Poe2DbModifierApiRowType = {
    sourcePageSlug: string;
    section: string;
    subgroup: string | null;
    modifierName: string;
    requiredLevel: number | null;
    modGenerationTypeId: number | null;
    modFamilies: string[];
    statLineText: string;
    dropChanceValue: number | null;
    itemClassCode: string | null;
    itemClassTags: string | null;
  };

  type Poe2DbModifierApiResponseType = {
    fetchedAtIso: string;
    rowCount: number;
    rows: Poe2DbModifierApiRowType[];
  };
}

