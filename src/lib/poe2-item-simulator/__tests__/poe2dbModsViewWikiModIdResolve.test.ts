import { resolveWikiModIdForPoe2DbModsViewNormalRow } from "@/lib/poe2-item-simulator/poe2dbModsViewWikiModIdResolve";
import type { WikiItemModTiersFileType } from "@/lib/poe2-item-simulator/wikiModTierTypes";
import wikiModTierPayload from "@/lib/poe2-item-simulator/data/poe2wiki-item-mod-tiers.json";

const wikiRows = (wikiModTierPayload as WikiItemModTiersFileType).rows;

describe("resolveWikiModIdForPoe2DbModsViewNormalRow", () => {
  test("prefix IncreasedLife without Code: matches wiki tier by family, level, stat numbers", () => {
    expect(
      resolveWikiModIdForPoe2DbModsViewNormalRow(
        {
          ModFamilyList: ["IncreasedLife"],
          ModGenerationTypeID: "1",
          Level: "54",
          str: "<span class='mod-value'>(100—119)</span> to maximum Life",
          DropChance: 5000,
        },
        wikiRows,
      ),
    ).toBe("IncreasedLife8");
  });

  test("still prefers explicit Code when present", () => {
    expect(
      resolveWikiModIdForPoe2DbModsViewNormalRow(
        {
          Code: "IncreasedLife1",
          ModFamilyList: ["IncreasedLife"],
          ModGenerationTypeID: "1",
          Level: "1",
          str: "",
          DropChance: 100,
        },
        wikiRows,
      ),
    ).toBe("IncreasedLife1");
  });

  test("DefencesPercent: ignores misleading IncreasedEnergyShieldPercent Code; picks local ES % wiki id", () => {
    expect(
      resolveWikiModIdForPoe2DbModsViewNormalRow(
        {
          Code: "IncreasedEnergyShieldPercent7",
          ModFamilyList: ["DefencesPercent"],
          ModGenerationTypeID: "1",
          Level: "75",
          str:
            "<span class='mod-value'>(101—110)</span>% increased [[Energy Shield]]",
          DropChance: 1000,
        },
        wikiRows,
      ),
    ).toBe("LocalIncreasedEnergyShieldPercent8");
  });
});
