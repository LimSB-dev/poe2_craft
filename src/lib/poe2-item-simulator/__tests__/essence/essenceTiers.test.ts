import craftLabEssenceWikiTiers from "@/lib/poe2-item-simulator/data/craftLabEssenceWikiTiers.json";
import {
  computeEssenceReferenceSpawnWeight,
  CRAFT_LAB_ESSENCE_DEFINITIONS,
  getCraftLabEssenceByKey,
} from "@/lib/poe2-item-simulator/essence/essence";

describe("craft lab essence tiers (wiki data + forced mod ranges)", () => {
  test("57 definitions aligned with craftLabEssenceWikiTiers.json", () => {
    expect(CRAFT_LAB_ESSENCE_DEFINITIONS).toHaveLength(craftLabEssenceWikiTiers.length);
    for (let index = 0; index < craftLabEssenceWikiTiers.length; index += 1) {
      const row = craftLabEssenceWikiTiers[index];
      const expectedKey = `essence_${row.familyKey}_t${row.tierGrade}`;
      const definition = CRAFT_LAB_ESSENCE_DEFINITIONS[index];
      expect(definition).toBeDefined();
      if (definition === undefined) {
        return;
      }
      expect(definition.essenceKey).toBe(expectedKey);
      expect(definition.wikiDropLevel).toBe(row.wikiDropLevel);
      expect(definition.displayName).toBe(row.displayName);
      expect(definition.referenceSpawnWeight).toBe(
        computeEssenceReferenceSpawnWeight(row.wikiDropLevel, row.tierGrade as 1 | 2 | 3),
      );
    }
  });

  test("forced tier band widens with essence tier grade", () => {
    const t1 = getCraftLabEssenceByKey("essence_attack_t1");
    const t2 = getCraftLabEssenceByKey("essence_attack_t2");
    const t3 = getCraftLabEssenceByKey("essence_attack_t3");
    expect(t1?.forcedTierMin).toBe(1);
    expect(t1?.forcedTierMax).toBe(2);
    expect(t2?.forcedTierMin).toBe(2);
    expect(t2?.forcedTierMax).toBe(3);
    expect(t3?.forcedTierMin).toBe(3);
    expect(t3?.forcedTierMax).toBe(3);
  });

  test("same wikiDropLevel: greater tier has lower referenceSpawnWeight than lesser", () => {
    const alacrityT1 = getCraftLabEssenceByKey("essence_alacrity_t1");
    const alacrityT3 = getCraftLabEssenceByKey("essence_alacrity_t3");
    expect(alacrityT1?.wikiDropLevel).toBe(1);
    expect(alacrityT3?.wikiDropLevel).toBe(1);
    expect(alacrityT3?.referenceSpawnWeight).toBeLessThan(alacrityT1?.referenceSpawnWeight ?? 0);
  });
});

