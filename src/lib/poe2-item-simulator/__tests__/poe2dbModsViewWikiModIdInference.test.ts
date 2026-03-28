import { inferWikiModIdFromPoe2DbModsViewNormalRow } from "@/lib/poe2-item-simulator/poe2dbModsViewWikiModIdInference";

describe("poe2dbModsViewWikiModIdInference", () => {
  test("uses Code when present", () => {
    expect(
      inferWikiModIdFromPoe2DbModsViewNormalRow({
        Code: "ExplicitStat1",
        ModGenerationTypeID: "2",
        ModFamilyList: ["Test"],
        Level: "1",
        str: "x",
        spawn_no: ["ring"],
        DropChance: "100",
      }),
    ).toBe("ExplicitStat1");
  });

  test("CriticalStrikeChance global: amulet-only top tier maps to CriticalStrikeChance6", () => {
    expect(
      inferWikiModIdFromPoe2DbModsViewNormalRow({
        Name: "- x",
        Level: "72",
        ModGenerationTypeID: "2",
        ModFamilyList: ["CriticalStrikeChanceIncrease"],
        str: "<span class='mod-value'>(46—50)</span>",
        spawn_no: ["amulet", "default"],
      }),
    ).toBe("CriticalStrikeChance6");
  });

  test("GlobalMinion +3 amulet-only maps to GlobalMinionSpellSkillGemLevel3", () => {
    expect(
      inferWikiModIdFromPoe2DbModsViewNormalRow({
        Name: "- x",
        Level: "75",
        ModGenerationTypeID: "2",
        ModFamilyList: ["IncreaseSocketedGemLevel"],
        str:
          "text <span class='mod-value'>+3</span> [[Minion]]",
        spawn_no: ["amulet", "default"],
      }),
    ).toBe("GlobalMinionSpellSkillGemLevel3");
  });
});
