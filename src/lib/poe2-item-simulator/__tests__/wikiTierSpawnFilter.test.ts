import {
  inferItemStatTagsFromPoe2dbTags,
  wikiPositiveSpawnTagsForSubType,
  wikiSpawnRowMatchesBaseItem,
  wikiTierSpawnContextFromBaseFilters,
} from "@/lib/poe2-item-simulator/wikiTierSpawnFilter";
import wikiModTierPayload from "@/lib/poe2-item-simulator/data/poe2wiki-item-mod-tiers.json";
import type { WikiItemModTiersFileType } from "@/lib/poe2-item-simulator/wikiModTierTypes";

const wikiFile = wikiModTierPayload as WikiItemModTiersFileType;

describe("wikiTierSpawnFilter", () => {
  test("inferItemStatTagsFromPoe2dbTags maps armour class tags to str/dex/int", () => {
    expect(inferItemStatTagsFromPoe2dbTags(["str_armour", "helmet"])).toEqual(["str"]);
    expect(inferItemStatTagsFromPoe2dbTags(["dex_armour"])).toEqual(["dex"]);
    expect(inferItemStatTagsFromPoe2dbTags(["str_dex_armour"])).toEqual(["str", "dex"]);
  });

  test("wikiPositiveSpawnTagsForSubType: empty statTags + poe2db str_armour narrows armour class pool", () => {
    const withPoe2db = wikiPositiveSpawnTagsForSubType("helmet", [], [
      "str_armour",
      "helmet",
      "armour",
    ]);
    expect(withPoe2db).toContain("str_armour");
    expect(withPoe2db).not.toContain("dex_armour");
    const broad = wikiPositiveSpawnTagsForSubType("helmet", []);
    expect(broad).toContain("dex_armour");
  });

  test("wikiPositiveSpawnTagsForSubType: staff ignores poe2dbTags — only wiki staff column for spawn OR", () => {
    expect(wikiPositiveSpawnTagsForSubType("staff", ["int"], ["staff", "twohand", "weapon"])).toEqual([
      "staff",
    ]);
  });

  test("wikiPositiveSpawnTagsForSubType covers weapon / shield / jewellery / focus (never empty when applicable)", () => {
    expect(wikiPositiveSpawnTagsForSubType("bow", [])).toEqual(
      expect.arrayContaining(["bow", "weapon"]),
    );
    expect(wikiPositiveSpawnTagsForSubType("shield", ["str"])).toEqual(
      expect.arrayContaining(["shield", "str_shield"]),
    );
    expect(wikiPositiveSpawnTagsForSubType("buckler", ["str", "int"])).toEqual(
      expect.arrayContaining(["shield", "str_int_shield"]),
    );
    expect(wikiPositiveSpawnTagsForSubType("ring", [])).toEqual(["ring"]);
    expect(wikiPositiveSpawnTagsForSubType("focus", ["int"])).toEqual(
      expect.arrayContaining(["focus", "int_armour"]),
    );
    expect(wikiPositiveSpawnTagsForSubType("helmet", ["dex"])).toEqual(
      expect.arrayContaining(["helmet", "dex_armour"]),
    );
    expect(wikiPositiveSpawnTagsForSubType("helmet", [])).toEqual(
      expect.arrayContaining(["helmet", "armour", "str_armour"]),
    );
  });

  test("wikiSpawnRowMatchesBaseItem: dex-only row excluded for helmet when poe2dbTags imply str only", () => {
    const row = wikiFile.rows.find((r) => {
      return r.wikiModId === "Dexterity1";
    });
    expect(row).toBeDefined();
    const strHelmet = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "helmet",
      itemStatTags: [],
      poe2dbTags: ["str_armour", "helmet", "armour"],
    });
    expect(wikiSpawnRowMatchesBaseItem(row!, strHelmet!)).toBe(false);
  });

  test("wikiSpawnRowMatchesBaseItem: str-only armour row (str_armour only, no helmet key) matches helmet when stat tags unset", () => {
    const row = wikiFile.rows.find((r) => {
      return r.wikiModId === "LocalIncreasedPhysicalDamageReductionRatingPercent1";
    });
    expect(row).toBeDefined();
    const helmetNoAffinity = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "helmet",
      itemStatTags: [],
    });
    expect(wikiSpawnRowMatchesBaseItem(row!, helmetNoAffinity!)).toBe(true);
  });

  test("wikiSpawnRowMatchesBaseItem: IncreasedLife12 is body-only — excluded for helmet and shield", () => {
    const row = wikiFile.rows.find((r) => {
      return r.wikiModId === "IncreasedLife12";
    });
    expect(row).toBeDefined();
    const helmetCtx = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "helmet",
      itemStatTags: ["str"],
    });
    const shieldCtx = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "shield",
      itemStatTags: ["str"],
    });
    const bodyCtx = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "bodyArmour",
      itemStatTags: ["str"],
    });
    expect(wikiSpawnRowMatchesBaseItem(row!, helmetCtx!)).toBe(false);
    expect(wikiSpawnRowMatchesBaseItem(row!, shieldCtx!)).toBe(false);
    expect(wikiSpawnRowMatchesBaseItem(row!, bodyCtx!)).toBe(true);
  });

  test("wikiSpawnRowMatchesBaseItem: FireDamage ring-only row excluded for bow", () => {
    const row = wikiFile.rows.find((r) => {
      return (
        r.modGroups === "FireDamage" &&
        r.generationType === 1 &&
        r.spawnWeights.some((w) => {
          return w.tag === "ring" && w.value > 0;
        }) &&
        !r.spawnWeights.some((w) => {
          return w.tag === "bow" && w.value > 0;
        })
      );
    });
    expect(row).toBeDefined();
    const bowCtx = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "bow",
      itemStatTags: ["dex"],
    });
    expect(wikiSpawnRowMatchesBaseItem(row!, bowCtx!)).toBe(false);
  });

  test("wikiSpawnRowMatchesBaseItem: Intelligence1 has int_armour but no body_armour key — still matches int body armour", () => {
    const row = wikiFile.rows.find((r) => {
      return r.wikiModId === "Intelligence1";
    });
    expect(row).toBeDefined();
    const bodyIntCtx = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "bodyArmour",
      itemStatTags: ["int"],
    });
    expect(wikiSpawnRowMatchesBaseItem(row!, bodyIntCtx!)).toBe(true);
  });

  test("wikiSpawnRowMatchesBaseItem: ItemFoundRarityIncreasePrefix top two tiers exclude helmet (PoE2DB)", () => {
    const p5 = wikiFile.rows.find((r) => {
      return r.wikiModId === "ItemFoundRarityIncreasePrefix5";
    });
    const p3 = wikiFile.rows.find((r) => {
      return r.wikiModId === "ItemFoundRarityIncreasePrefix3";
    });
    expect(p5).toBeDefined();
    expect(p3).toBeDefined();
    const helmetCtx = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "helmet",
      itemStatTags: ["str"],
    });
    expect(wikiSpawnRowMatchesBaseItem(p5!, helmetCtx!)).toBe(false);
    expect(wikiSpawnRowMatchesBaseItem(p3!, helmetCtx!)).toBe(true);
  });

  test("wikiSpawnRowMatchesBaseItem: EnergyShieldRechargeRate6 excludes body armour (body_armour:0), allows focus", () => {
    const row = wikiFile.rows.find((r) => {
      return r.wikiModId === "EnergyShieldRechargeRate6";
    });
    expect(row).toBeDefined();
    const bodyCtx = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "bodyArmour",
      itemStatTags: ["int"],
    });
    const focusCtx = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "focus",
      itemStatTags: ["int"],
    });
    expect(wikiSpawnRowMatchesBaseItem(row!, bodyCtx!)).toBe(false);
    expect(wikiSpawnRowMatchesBaseItem(row!, focusCtx!)).toBe(true);
  });

  test("wikiSpawnRowMatchesBaseItem: FireDamage bow row matches bow context", () => {
    const row = wikiFile.rows.find((r) => {
      return (
        r.modGroups === "FireDamage" &&
        r.generationType === 1 &&
        r.spawnWeights.some((w) => {
          return w.tag === "bow" && w.value > 0;
        })
      );
    });
    expect(row).toBeDefined();
    const bowCtx = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "bow",
      itemStatTags: ["dex"],
    });
    expect(wikiSpawnRowMatchesBaseItem(row!, bowCtx!)).toBe(true);
  });

  test("wikiSpawnRowMatchesBaseItem: spell staff uses staff spawn column — exclude two_hand_weapon-only attack rows", () => {
    const attackTwoHandOnly = wikiFile.rows.find((r) => {
      return r.wikiModId === "LocalAddedPhysicalDamageTwoHand1";
    });
    expect(attackTwoHandOnly).toBeDefined();
    const spellStaffRow = wikiFile.rows.find((r) => {
      return r.wikiModId === "SpellDamageOnTwoHandWeapon1";
    });
    expect(spellStaffRow).toBeDefined();

    const staffCtx = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "staff",
      itemStatTags: ["int"],
      poe2dbTags: ["staff", "twohand"],
    });
    expect(wikiSpawnRowMatchesBaseItem(attackTwoHandOnly!, staffCtx!)).toBe(
      false,
    );
    expect(wikiSpawnRowMatchesBaseItem(spellStaffRow!, staffCtx!)).toBe(true);
  });

  test("wikiSpawnRowMatchesBaseItem: spell staff suffix — weapon-only crit mult row excluded even if poe2db has weapon tag", () => {
    const localCritWeaponOnly = wikiFile.rows.find((r) => {
      return r.wikiModId === "LocalCriticalMultiplier1";
    });
    expect(localCritWeaponOnly).toBeDefined();
    const spellCritTwoHand = wikiFile.rows.find((r) => {
      return r.wikiModId === "SpellCriticalStrikeMultiplierTwoHand1";
    });
    expect(spellCritTwoHand).toBeDefined();

    const staffCtx = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "staff",
      itemStatTags: ["int"],
      poe2dbTags: ["staff", "twohand", "weapon"],
    });
    expect(wikiSpawnRowMatchesBaseItem(localCritWeaponOnly!, staffCtx!)).toBe(
      false,
    );
    expect(wikiSpawnRowMatchesBaseItem(spellCritTwoHand!, staffCtx!)).toBe(
      true,
    );
  });

});
