import {
  inferItemStatTagsFromPoe2dbTags,
  itemAttributeStatTagsForModFiltering,
  matchesBaseItemToArmourStatAffinity,
  resolvePoe2DbModifiersCalcPageSlugsForWikiTierContext,
} from "@/lib/poe2db/poe2dbStatAffinityPages";

describe("itemAttributeStatTagsForModFiltering + matchesBaseItemToArmourStatAffinity", () => {
  test("PoE2DB str_armour → INT 탭에서 제외 (녹슨 흉갑 유형)", () => {
    const record = {
      tags: ["str_armour", "body_armour", "armour", "ezomyte_basetype"],
    };
    const eff = itemAttributeStatTagsForModFiltering(record);
    expect(eff).toEqual(["str"]);
    expect(matchesBaseItemToArmourStatAffinity(eff, "int")).toBe(false);
    expect(matchesBaseItemToArmourStatAffinity(eff, "str")).toBe(true);
  });

  test("PoE2DB dex_armour → STR 탭에서 제외 (가죽 조끼 유형)", () => {
    const record = {
      tags: ["dex_armour", "body_armour", "armour", "ezomyte_basetype"],
    };
    const eff = itemAttributeStatTagsForModFiltering(record);
    expect(eff).toEqual(["dex"]);
    expect(matchesBaseItemToArmourStatAffinity(eff, "str")).toBe(false);
    expect(matchesBaseItemToArmourStatAffinity(eff, "dex")).toBe(true);
  });

  test("PoE2DB dex_shield → dex (버클러 등)", () => {
    expect(inferItemStatTagsFromPoe2dbTags(["dex_shield", "buckler"])).toEqual(["dex"]);
  });
});

describe("resolvePoe2DbModifiersCalcPageSlugsForWikiTierContext", () => {
  test("helmet + str → Helmets_str (PoE2DB ModifiersCalc slug)", () => {
    expect(resolvePoe2DbModifiersCalcPageSlugsForWikiTierContext("helmet", ["str"])).toEqual(["Helmets_str"]);
  });

  test("body armour + str → Body_Armours_str", () => {
    expect(resolvePoe2DbModifiersCalcPageSlugsForWikiTierContext("bodyArmour", ["str"])).toEqual([
      "Body_Armours_str",
    ]);
  });

  test("wand → single weapon list slug", () => {
    expect(resolvePoe2DbModifiersCalcPageSlugsForWikiTierContext("wand", [])).toEqual(["Wands"]);
  });
});
