import type { CraftingCurrencyIdType } from "@/lib/crafting-lab/craftingLabCurrencyIds";

export const getCraftLabDisabledCurrencyRowTooltip = (
  id: CraftingCurrencyIdType,
  tCraft: (key: string) => string,
): string => {
  switch (id) {
    case "orb_divine": {
      return tCraft("craftLab.divineDisabledHint");
    }
    case "orb_vaal": {
      return tCraft("craftLab.vaalOrbDisabledHint");
    }
    case "orb_mirror": {
      return tCraft("craftLab.mirrorDisabledHint");
    }
    case "orb_chance": {
      return tCraft("craftLab.chanceDisabledHint");
    }
    default: {
      return tCraft("craftLab.currencyTabDisabledGeneric");
    }
  }
};
