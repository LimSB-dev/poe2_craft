/**
 * PoE2 심연(Abyss) — 보존된 뼈(Preserved bone)로 희귀 아이템에 **타락(Desecrated)** 옵션을 추가하고,
 * 심연 징조(Abyss Omen)로 다음 뼈/소멸 행동을 보조합니다.
 * @see https://www.poe2wiki.net/wiki/Abyss
 */
import { BASE_ITEM_SUB_TYPES_BY_EQUIPMENT } from "@/lib/poe2-item-simulator/baseItemDb";
import { isCorruptedRoll } from "@/lib/poe2-item-simulator/itemCorruptionCraftingGuard";
import { rollRandomMod, type IModRollBaseFiltersType } from "@/lib/poe2-item-simulator/roller";
import { getRandomIntInclusive } from "@/lib/poe2-item-simulator/random";

const RARE_MAX_TOTAL_AFFIXES: number = 6;

const totalAffixCount = (item: IItemRoll): number => {
  return item.prefixes.length + item.suffixes.length;
};

/** 목걸이·반지·벨트 — Gnawed/Preserved/Ancient Collarbone */
export const BONE_JEWELLERY_BELT_SUB_TYPES: readonly IBaseItemSubTypeType[] = [
  "amulet",
  "ring",
  "belt",
];

/** 무기·석궁 — Jawbone */
export const BONE_WEAPON_QUIVER_SUB_TYPES: readonly IBaseItemSubTypeType[] = [
  ...BASE_ITEM_SUB_TYPES_BY_EQUIPMENT.weapon,
  "quiver",
];

/** 방어구(방패·버클러 포함) — Rib */
export const BONE_ARMOUR_SUB_TYPES: readonly IBaseItemSubTypeType[] = [
  ...BASE_ITEM_SUB_TYPES_BY_EQUIPMENT.armour,
  "shield",
  "buckler",
];

/** 주얼 슬롯 — 이 DB에는 `talisman`만 대응 (위키 Preserved Cranium). */
export const BONE_JEWEL_SUB_TYPES: readonly IBaseItemSubTypeType[] = ["talisman"];

export type BoneSlotCategoryType =
  | "jewellery_belt"
  | "weapon_quiver"
  | "armour"
  | "jewel";

export type CraftLabAbyssBoneIdType =
  | "bone_gnawed_collarbone"
  | "bone_gnawed_jawbone"
  | "bone_gnawed_rib"
  | "bone_preserved_collarbone"
  | "bone_preserved_jawbone"
  | "bone_preserved_rib"
  | "bone_preserved_cranium"
  | "bone_ancient_collarbone"
  | "bone_ancient_jawbone"
  | "bone_ancient_rib";

export interface IBoneDefinitionType {
  boneKey: CraftLabAbyssBoneIdType;
  slotCategory: BoneSlotCategoryType;
}

export const CRAFT_LAB_BONE_DEFINITIONS: readonly IBoneDefinitionType[] = [
  { boneKey: "bone_gnawed_collarbone", slotCategory: "jewellery_belt" },
  { boneKey: "bone_gnawed_jawbone", slotCategory: "weapon_quiver" },
  { boneKey: "bone_gnawed_rib", slotCategory: "armour" },
  { boneKey: "bone_preserved_collarbone", slotCategory: "jewellery_belt" },
  { boneKey: "bone_preserved_jawbone", slotCategory: "weapon_quiver" },
  { boneKey: "bone_preserved_rib", slotCategory: "armour" },
  { boneKey: "bone_preserved_cranium", slotCategory: "jewel" },
  { boneKey: "bone_ancient_collarbone", slotCategory: "jewellery_belt" },
  { boneKey: "bone_ancient_jawbone", slotCategory: "weapon_quiver" },
  { boneKey: "bone_ancient_rib", slotCategory: "armour" },
] as const;

const getAllowedSubTypesForBoneCategory = (
  category: BoneSlotCategoryType,
): readonly IBaseItemSubTypeType[] => {
  if (category === "jewellery_belt") {
    return BONE_JEWELLERY_BELT_SUB_TYPES;
  }
  if (category === "weapon_quiver") {
    return BONE_WEAPON_QUIVER_SUB_TYPES;
  }
  if (category === "armour") {
    return BONE_ARMOUR_SUB_TYPES;
  }
  return BONE_JEWEL_SUB_TYPES;
};

export const getBoneDefinition = (
  boneKey: CraftLabAbyssBoneIdType,
): IBoneDefinitionType | undefined => {
  return CRAFT_LAB_BONE_DEFINITIONS.find((b) => {
    return b.boneKey === boneKey;
  });
};

/**
 * Preserved / gnawed / ancient bone (abyss) — applicability for adding a desecrated line in this sim.
 *
 * - `rarity === "rare"`.
 * - Fewer than six explicit mods (room for one more).
 * - `baseFilters.baseItemSubType` must match the bone’s {@link IBoneDefinitionType.slotCategory}
 *   (jewellery+belt, weapon+quiver, armour+shield+buckler, or talisman for cranium).
 * - Not corrupted (Putrefaction already corrupts; further standard abyss crafting is blocked).
 */
export const canApplyPreservedBone = (
  item: IItemRoll,
  bone: IBoneDefinitionType,
  baseFilters?: { baseItemSubType?: IBaseItemSubTypeType },
): boolean => {
  if (isCorruptedRoll(item)) {
    return false;
  }
  if (item.rarity !== "rare") {
    return false;
  }
  if (totalAffixCount(item) >= RARE_MAX_TOTAL_AFFIXES) {
    return false;
  }
  const sub = baseFilters?.baseItemSubType;
  if (sub === undefined) {
    return false;
  }
  const allowed = getAllowedSubTypesForBoneCategory(bone.slotCategory);
  return allowed.includes(sub as IBaseItemSubTypeType);
};

export const isUnrevealedDesecratedMod = (mod: IModDefinition | undefined): boolean => {
  if (mod === undefined) {
    return false;
  }
  return (
    mod.isDesecrated === true &&
    mod.isDesecratedRevealed === false &&
    mod.modKey.startsWith("desecrated_unrevealed")
  );
};

const cloneItemRollShallow = (item: IItemRoll): IItemRoll => {
  const base: IItemRoll = {
    rarity: item.rarity,
    prefixes: [...item.prefixes],
    suffixes: [...item.suffixes],
  };
  if (item.hinekoraLockActive === true) {
    base.hinekoraLockActive = true;
  }
  if (item.isCorrupted === true) {
    base.isCorrupted = true;
  }
  return base;
};

/**
 * 영혼의 우물(Well of Souls): 미공개 타락 줄을 **후보 3개** 중 하나로 확정한다.
 * 후보는 이 시뮬의 희귀 접두/접미 풀에서 중복 없이 굴린다(게임 정확 가중치는 비공개).
 */
export const rollSoulWellRevealCandidates = (
  item: IItemRoll,
  modType: ModTypeType,
  baseFilters?: IModRollBaseFiltersType,
): IModDefinition[] => {
  const excluded = new Set<string>([
    ...item.prefixes.map((m) => {
      return m.modKey;
    }),
    ...item.suffixes.map((m) => {
      return m.modKey;
    }),
  ]);
  const candidates: IModDefinition[] = [];
  const maxAttempts = 80;
  for (let attempt = 0; attempt < maxAttempts && candidates.length < 3; attempt += 1) {
    const rollExcluded = new Set<string>(excluded);
    for (const c of candidates) {
      rollExcluded.add(c.modKey);
    }
    try {
      const rolled = rollRandomMod({
        rarity: "rare",
        modType,
        excludedModKeys: rollExcluded,
        ...baseFilters,
      });
      candidates.push(rolled);
      excluded.add(rolled.modKey);
    } catch {
      break;
    }
  }
  if (candidates.length === 0) {
    throw new Error("Soul Well: no modifier candidates available for this slot.");
  }
  return candidates;
};

/**
 * 선택한 후보로 미공개 타락 줄을 확정(공개)한다.
 */
export const applySoulWellRevealChoice = (
  item: IItemRoll,
  kind: "prefix" | "suffix",
  slotIndex: number,
  chosen: IModDefinition,
): IItemRoll => {
  const current =
    kind === "prefix" ? item.prefixes[slotIndex] : item.suffixes[slotIndex];
  if (!isUnrevealedDesecratedMod(current)) {
    throw new Error("Soul Well: no unrevealed desecrated modifier at this slot.");
  }
  const revealed: IModDefinition = {
    ...chosen,
    isDesecrated: true,
    isDesecratedRevealed: true,
  };
  const next = cloneItemRollShallow(item);
  if (kind === "prefix") {
    const arr = [...next.prefixes];
    arr[slotIndex] = revealed;
    next.prefixes = arr;
  } else {
    const arr = [...next.suffixes];
    arr[slotIndex] = revealed;
    next.suffixes = arr;
  }
  return next;
};

const makeUnrevealedDesecratedMod = (modType: ModTypeType): IModDefinition => {
  const id = `u${String(getRandomIntInclusive(10000, 99999))}`;
  return {
    modKey: `desecrated_unrevealed_${id}`,
    displayName: "desecratedUnrevealedLine",
    tier: 1,
    modType,
    weight: 1,
    isDesecrated: true,
    isDesecratedRevealed: false,
  };
};

const makeGuaranteedFamilyDesecratedMod = (
  family: "kurgal" | "amanamu" | "ulaman",
  modType: ModTypeType,
): IModDefinition => {
  const key =
    family === "kurgal"
      ? "desecrated_family_kurgal"
      : family === "amanamu"
        ? "desecrated_family_amanamu"
        : "desecrated_family_ulaman";
  const displayName =
    family === "kurgal"
      ? "desecratedFamilyKurgal"
      : family === "amanamu"
        ? "desecratedFamilyAmanamu"
        : "desecratedFamilyUlaman";
  return {
    modKey: key,
    displayName,
    tier: 1,
    modType,
    weight: 1,
    isDesecrated: true,
    isDesecratedRevealed: true,
  };
};

export type CraftLabAbyssOmenIdType =
  | "omen_abyssal_echoes"
  | "omen_dextral_necromancy"
  | "omen_sinistral_necromancy"
  | "omen_light"
  | "omen_putrefaction"
  | "omen_blackblooded"
  | "omen_liege"
  | "omen_sovereign";

const isWeaponOrJewelleryForFamilyOmen = (sub: IBaseItemSubTypeType | undefined): boolean => {
  if (sub === undefined) {
    return false;
  }
  if ((BONE_JEWELLERY_BELT_SUB_TYPES as readonly string[]).includes(sub)) {
    return true;
  }
  return (BASE_ITEM_SUB_TYPES_BY_EQUIPMENT.weapon as readonly string[]).includes(sub);
};

const pickModTypeForDesecration = (
  item: IItemRoll,
  stagedOmen: CraftLabAbyssOmenIdType | null | undefined,
): ModTypeType => {
  if (stagedOmen === "omen_sinistral_necromancy") {
    if (item.prefixes.length >= 3) {
      throw new Error("Desecration: no free prefix slot for Sinistral omen.");
    }
    return "prefix";
  }
  if (stagedOmen === "omen_dextral_necromancy") {
    if (item.suffixes.length >= 3) {
      throw new Error("Desecration: no free suffix slot for Dextral omen.");
    }
    return "suffix";
  }
  const canPrefix = item.prefixes.length < 3;
  const canSuffix = item.suffixes.length < 3;
  if (canPrefix && canSuffix) {
    return Math.random() < 0.5 ? "prefix" : "suffix";
  }
  if (canPrefix) {
    return "prefix";
  }
  if (canSuffix) {
    return "suffix";
  }
  throw new Error("Desecration: no free affix slot.");
};

/**
 * 보존된 뼈 1회: 미공개 타락 옵션 1줄 추가(영혼의 우물 공개는 별도).
 * 징조(시니스트럴/덱스트럴/가문)는 `stagedOmen`으로 소비.
 */
export const applyPreservedBone = (
  item: IItemRoll,
  bone: IBoneDefinitionType,
  baseFilters: { baseItemSubType?: IBaseItemSubTypeType } | undefined,
  stagedOmen: CraftLabAbyssOmenIdType | null,
): IItemRoll => {
  if (!canApplyPreservedBone(item, bone, baseFilters)) {
    throw new Error("Preserved bone: rare item and matching base slot required.");
  }
  if (stagedOmen === "omen_putrefaction") {
    return applyPutrefactionDesecration(item, baseFilters);
  }

  const sub = baseFilters?.baseItemSubType;
  const familyOmenActive =
    stagedOmen === "omen_blackblooded" ||
    stagedOmen === "omen_liege" ||
    stagedOmen === "omen_sovereign";

  const modType = pickModTypeForDesecration(item, familyOmenActive ? null : stagedOmen);

  let forcedMod: IModDefinition = makeUnrevealedDesecratedMod(modType);

  if (familyOmenActive) {
    if (!isWeaponOrJewelleryForFamilyOmen(sub)) {
      throw new Error(
        "This omen only applies to Weapon or Jewellery (belt/amulet/ring) desecration.",
      );
    }
    if (stagedOmen === "omen_blackblooded") {
      forcedMod = makeGuaranteedFamilyDesecratedMod("kurgal", modType);
    } else if (stagedOmen === "omen_liege") {
      forcedMod = makeGuaranteedFamilyDesecratedMod("amanamu", modType);
    } else {
      forcedMod = makeGuaranteedFamilyDesecratedMod("ulaman", modType);
    }
  }

  const next: IItemRoll = {
    rarity: item.rarity,
    prefixes: [...item.prefixes],
    suffixes: [...item.suffixes],
    isCorrupted: item.isCorrupted,
  };
  if (item.hinekoraLockActive === true) {
    next.hinekoraLockActive = true;
  }

  if (forcedMod.modType === "prefix") {
    next.prefixes = [...next.prefixes, forcedMod];
  } else {
    next.suffixes = [...next.suffixes, forcedMod];
  }

  if (stagedOmen === "omen_abyssal_echoes") {
    // 위키: 공개 시 선택지를 한 번 더 굴림 — 시뮬에서는 동일 슬롯에 힌트용 중복 미공개 1줄 생략·소비만 처리.
  }

  return next;
};

const applyPutrefactionDesecration = (
  item: IItemRoll,
  baseFilters: { baseItemSubType?: IBaseItemSubTypeType } | undefined,
): IItemRoll => {
  if (item.rarity !== "rare") {
    throw new Error("Putrefaction: rare item required.");
  }
  if (baseFilters?.baseItemSubType === undefined) {
    throw new Error("Putrefaction: base slot required.");
  }
  const count = getRandomIntInclusive(4, 6);
  const prefixes: IModDefinition[] = [];
  const suffixes: IModDefinition[] = [];
  for (let i = 0; i < count; i += 1) {
    const canP = prefixes.length < 3;
    const canS = suffixes.length < 3;
    if (!canP && !canS) {
      break;
    }
    let usePrefix = false;
    if (canP && !canS) {
      usePrefix = true;
    } else if (!canP && canS) {
      usePrefix = false;
    } else {
      usePrefix = Math.random() < 0.5;
    }
    const mod = makeUnrevealedDesecratedMod(usePrefix ? "prefix" : "suffix");
    if (usePrefix) {
      prefixes.push(mod);
    } else {
      suffixes.push(mod);
    }
  }
  return {
    rarity: "rare",
    prefixes,
    suffixes,
    isCorrupted: true,
    hinekoraLockActive: item.hinekoraLockActive === true ? true : undefined,
  };
};

export const isCraftLabBoneId = (id: string): id is CraftLabAbyssBoneIdType => {
  return CRAFT_LAB_BONE_DEFINITIONS.some((b) => {
    return b.boneKey === id;
  });
};

export const isCraftLabAbyssOmenId = (id: string): id is CraftLabAbyssOmenIdType => {
  return (
    id === "omen_abyssal_echoes" ||
    id === "omen_dextral_necromancy" ||
    id === "omen_sinistral_necromancy" ||
    id === "omen_light" ||
    id === "omen_putrefaction" ||
    id === "omen_blackblooded" ||
    id === "omen_liege" ||
    id === "omen_sovereign"
  );
};

export const CRAFT_LAB_ABYSS_OMEN_IDS: readonly CraftLabAbyssOmenIdType[] = [
  "omen_abyssal_echoes",
  "omen_dextral_necromancy",
  "omen_sinistral_necromancy",
  "omen_light",
  "omen_putrefaction",
  "omen_blackblooded",
  "omen_liege",
  "omen_sovereign",
] as const;

/**
 * 창고 UI: **열** = 빗장뼈 · 턱뼈 · 갈비뼈, **행** = 갉음 · 보존 · 고대.
 * {@link CRAFT_LAB_ABYSS_BONE_CRANIUM_ID} 는 주얼 전용이라 3×3 그리드 밖에 둡니다.
 */
export const CRAFT_LAB_ABYSS_BONE_GRID: readonly (readonly CraftLabAbyssBoneIdType[])[] =
  [
    [
      "bone_gnawed_collarbone",
      "bone_gnawed_jawbone",
      "bone_gnawed_rib",
    ],
    [
      "bone_preserved_collarbone",
      "bone_preserved_jawbone",
      "bone_preserved_rib",
    ],
    [
      "bone_ancient_collarbone",
      "bone_ancient_jawbone",
      "bone_ancient_rib",
    ],
  ] as const;

export const CRAFT_LAB_ABYSS_BONE_CRANIUM_ID: CraftLabAbyssBoneIdType =
  "bone_preserved_cranium";

export const CRAFT_LAB_ABYSS_BONE_IDS: readonly CraftLabAbyssBoneIdType[] =
  CRAFT_LAB_BONE_DEFINITIONS.map((b) => {
    return b.boneKey;
  });
