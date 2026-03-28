import { POE2DB_MODIFIERS_CALC_SLUG_TO_WIKI_SPAWN_TAG } from "@/lib/poe2db/poe2dbModifiersCalcSlugToWikiSpawnTag";

describe("POE2DB_MODIFIERS_CALC_SLUG_TO_WIKI_SPAWN_TAG", () => {
  test("armour / jewellery slugs map to wiki spawn column tags", () => {
    expect(POE2DB_MODIFIERS_CALC_SLUG_TO_WIKI_SPAWN_TAG.Body_Armours).toBe("body_armour");
    expect(POE2DB_MODIFIERS_CALC_SLUG_TO_WIKI_SPAWN_TAG.Helmets).toBe("helmet");
    expect(POE2DB_MODIFIERS_CALC_SLUG_TO_WIKI_SPAWN_TAG.Gloves).toBe("gloves");
    expect(POE2DB_MODIFIERS_CALC_SLUG_TO_WIKI_SPAWN_TAG.Boots).toBe("boots");
    expect(POE2DB_MODIFIERS_CALC_SLUG_TO_WIKI_SPAWN_TAG.Shields).toBe("shield");
    expect(POE2DB_MODIFIERS_CALC_SLUG_TO_WIKI_SPAWN_TAG.Bucklers).toBe("shield");
    expect(POE2DB_MODIFIERS_CALC_SLUG_TO_WIKI_SPAWN_TAG.Foci).toBe("focus");
    expect(POE2DB_MODIFIERS_CALC_SLUG_TO_WIKI_SPAWN_TAG.Rings).toBe("ring");
    expect(POE2DB_MODIFIERS_CALC_SLUG_TO_WIKI_SPAWN_TAG.Amulets).toBe("amulet");
    expect(POE2DB_MODIFIERS_CALC_SLUG_TO_WIKI_SPAWN_TAG.Belts).toBe("belt");
    expect(POE2DB_MODIFIERS_CALC_SLUG_TO_WIKI_SPAWN_TAG.Quivers).toBe("quiver");
  });

  test("weapon class slugs have no single wiki spawn column (null)", () => {
    expect(POE2DB_MODIFIERS_CALC_SLUG_TO_WIKI_SPAWN_TAG.Wands).toBeNull();
    expect(POE2DB_MODIFIERS_CALC_SLUG_TO_WIKI_SPAWN_TAG.Claws).toBeNull();
  });
});
