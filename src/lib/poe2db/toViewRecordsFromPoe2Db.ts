import type { Poe2DbModifierApiResponseType } from "@/lib/poe2-item-simulator/poe2dbModifiersApiTypes";
import { BASE_ITEM_SUB_TYPES_BY_EQUIPMENT } from "@/lib/poe2-item-simulator/baseItemDb";
import { extractPoe2DbModifierPartitionKey } from "@/lib/poe2db/extractPoe2DbModifierPartitionKey";

const SUB_TYPE_TO_EQUIPMENT_TYPE = new Map<IBaseItemSubTypeType, IBaseItemEquipmentTypeType>(
  Object.entries(BASE_ITEM_SUB_TYPES_BY_EQUIPMENT).flatMap(([equipmentType, subTypes]) => {
    return subTypes.map((subType) => {
      return [subType, equipmentType as IBaseItemEquipmentTypeType] as const;
    });
  }),
);
const NORMALIZED_SUB_TYPE_SET = new Set<IBaseItemSubTypeType>([
  ...SUB_TYPE_TO_EQUIPMENT_TYPE.keys(),
]);

const RAW_ITEM_CLASS_CODE_TO_SUB_TYPE: Record<string, IBaseItemSubTypeType> = {
  amulet: "amulet",
  amulets: "amulet",
  belt: "belt",
  belts: "belt",
  bodyarmour: "bodyArmour",
  bodyarmours: "bodyArmour",
  body_armour: "bodyArmour",
  body_armours: "bodyArmour",
  boots: "boots",
  bow: "bow",
  bows: "bow",
  buckler: "buckler",
  bucklers: "buckler",
  claw: "claw",
  claws: "claw",
  crossbow: "crossbow",
  crossbows: "crossbow",
  dagger: "dagger",
  daggers: "dagger",
  fishingrod: "fishingRod",
  fishingrods: "fishingRod",
  fishing_rod: "fishingRod",
  fishing_rods: "fishingRod",
  flail: "flail",
  flails: "flail",
  focus: "focus",
  foci: "focus",
  glove: "gloves",
  gloves: "gloves",
  helmet: "helmet",
  helmets: "helmet",
  onehandaxe: "oneHandAxe",
  onehandaxes: "oneHandAxe",
  one_handed_axe: "oneHandAxe",
  one_handed_axes: "oneHandAxe",
  onehandmace: "oneHandMace",
  onehandmaces: "oneHandMace",
  one_handed_mace: "oneHandMace",
  one_handed_maces: "oneHandMace",
  onehandsword: "oneHandSword",
  onehandswords: "oneHandSword",
  one_handed_sword: "oneHandSword",
  one_handed_swords: "oneHandSword",
  quarterstaff: "quarterstaff",
  quarterstaves: "quarterstaff",
  quiver: "quiver",
  quivers: "quiver",
  ring: "ring",
  rings: "ring",
  sceptre: "sceptre",
  sceptres: "sceptre",
  shield: "shield",
  shields: "shield",
  spear: "spear",
  spears: "spear",
  staff: "staff",
  staves: "staff",
  swordstaff: "staff",
  talisman: "talisman",
  talismans: "talisman",
  trap: "trap",
  traps: "trap",
  twohandaxe: "twoHandAxe",
  twohandaxes: "twoHandAxe",
  two_handed_axe: "twoHandAxe",
  two_handed_axes: "twoHandAxe",
  twohandmace: "twoHandMace",
  twohandmaces: "twoHandMace",
  two_handed_mace: "twoHandMace",
  two_handed_maces: "twoHandMace",
  twohandsword: "twoHandSword",
  twohandswords: "twoHandSword",
  two_handed_sword: "twoHandSword",
  two_handed_swords: "twoHandSword",
  wand: "wand",
  wands: "wand",
};

const parseRequiredTags = (rawTags: string | null): IBaseItemStatTagType[] => {
  if (rawTags === null) {
    return [];
  }
  const tags = rawTags.toLowerCase();
  const out: IBaseItemStatTagType[] = [];
  if (tags.includes("str")) {
    out.push("str");
  }
  if (tags.includes("dex")) {
    out.push("dex");
  }
  if (tags.includes("int")) {
    out.push("int");
  }
  return out;
};

const toAlphaToken = (index: number): string => {
  let value = index;
  let out = "";
  do {
    out = String.fromCharCode(65 + (value % 26)) + out;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return out;
};

const toModType = (
  section: string,
  modGenerationTypeId: number | null,
): IModDbRecordType["modType"] => {
  if (section === "corrupted" || section === "desecrated") {
    return modGenerationTypeId === 1 ? "corruptedPrefix" : "corruptedSuffix";
  }
  return modGenerationTypeId === 1 ? "prefix" : "suffix";
};

const normalizeItemClassCodeToSubType = (itemClassCode: string | null): IBaseItemSubTypeType | null => {
  if (itemClassCode === null) {
    return null;
  }
  const normalizedRaw = itemClassCode.trim();
  if (normalizedRaw.length === 0) {
    return null;
  }
  if (NORMALIZED_SUB_TYPE_SET.has(normalizedRaw as IBaseItemSubTypeType)) {
    return normalizedRaw as IBaseItemSubTypeType;
  }
  const lookupKey = normalizedRaw
    .toLowerCase()
    .replace(/[\s_-]+/g, "")
    .replace(/[^a-z0-9]/g, "");
  return RAW_ITEM_CLASS_CODE_TO_SUB_TYPE[lookupKey] ?? null;
};

const getEquipmentBucketFromItemClassCode = (
  itemClassCode: string | null,
): IBaseItemEquipmentTypeType | "unknown" => {
  const subType = normalizeItemClassCodeToSubType(itemClassCode);
  if (subType === null) {
    return "unknown";
  }
  const equipmentType = SUB_TYPE_TO_EQUIPMENT_TYPE.get(subType);
  if (equipmentType === undefined) {
    return "unknown";
  }
  return equipmentType;
};

type WeaponGripBucketType = "oneHand" | "twoHand" | "otherWeapon" | "nonWeapon" | "unknown";

const ONE_HAND_WEAPON_SUB_TYPES = new Set<IBaseItemSubTypeType>([
  "claw",
  "dagger",
  "wand",
  "oneHandSword",
  "oneHandAxe",
  "oneHandMace",
  "sceptre",
  "spear",
  "flail",
  "talisman",
  "trap",
]);

const TWO_HAND_WEAPON_SUB_TYPES = new Set<IBaseItemSubTypeType>([
  "bow",
  "staff",
  "twoHandSword",
  "twoHandAxe",
  "twoHandMace",
  "quarterstaff",
  "crossbow",
]);

const getWeaponGripBucketFromSubType = (subType: IBaseItemSubTypeType | null): WeaponGripBucketType => {
  if (subType === null) {
    return "unknown";
  }
  const equipmentType = SUB_TYPE_TO_EQUIPMENT_TYPE.get(subType);
  if (equipmentType !== "weapon") {
    return equipmentType === undefined ? "unknown" : "nonWeapon";
  }
  if (ONE_HAND_WEAPON_SUB_TYPES.has(subType)) {
    return "oneHand";
  }
  if (TWO_HAND_WEAPON_SUB_TYPES.has(subType)) {
    return "twoHand";
  }
  return "otherWeapon";
};

export const toViewRecordsFromPoe2Db = (
  payload: Poe2DbModifierApiResponseType,
): IModDbRecordType[] => {
  const toTemplateAndRanges = (
    statLineText: string,
  ): { template: string; ranges: Array<{ min: number; max: number }> } => {
    const ranges: Array<{ min: number; max: number }> = [];
    let working = statLineText;
    const pushRange = (min: number, max: number): string => {
      ranges.push({ min, max });
      return `__POEDB_RANGE_${toAlphaToken(ranges.length - 1)}__`;
    };

    working = working.replace(
      /(-?\d+(?:\.\d+)?)\s*[—~\-]\s*(-?\d+(?:\.\d+)?)/g,
      (_match, minRaw: string, maxRaw: string) => {
        const min = Number.parseFloat(minRaw);
        const max = Number.parseFloat(maxRaw);
        if (Number.isFinite(min) && Number.isFinite(max)) {
          return pushRange(min, max);
        }
        return _match;
      },
    );

    working = working.replace(/-?\d+(?:\.\d+)?/g, (numberRaw) => {
      const value = Number.parseFloat(numberRaw);
      if (!Number.isFinite(value)) {
        return numberRaw;
      }
      return pushRange(value, value);
    });

    const template = working.replace(/__POEDB_RANGE_[A-Z]+__/g, "#");
    return { template, ranges };
  };

  type GroupedType = {
    key: string;
    modType: IModDbRecordType["modType"];
    section: string;
    equipmentBucket: IBaseItemEquipmentTypeType | "unknown";
    weaponGripBucket: WeaponGripBucketType;
    template: string;
    modTags: Set<string>;
    applicableSubTypes: Set<IBaseItemSubTypeType>;
    requiredItemTags: Set<IBaseItemStatTagType>;
    members: Array<{
      requiredLevel: number;
      weight: number;
      ranges: Array<{ min: number; max: number }>;
    }>;
  };

  const groups = new Map<string, GroupedType>();

  for (const row of payload.rows) {
    const statLine = row.statLineText.length > 0 ? row.statLineText : row.modifierName;
    const parsed = toTemplateAndRanges(statLine);
    const modType = toModType(row.section, row.modGenerationTypeId);
    const normalizedSubType = normalizeItemClassCodeToSubType(row.itemClassCode);
    const equipmentBucket = getEquipmentBucketFromItemClassCode(row.itemClassCode);
    const weaponGripBucket = getWeaponGripBucketFromSubType(normalizedSubType);
    const modFamiliesKey = [...row.modFamilies].sort().join("|");
    const requiredTags = parseRequiredTags(row.itemClassTags);
    const requiredTagsKey = [...requiredTags].sort().join("|");
    const rawItemClassSegment =
      row.itemClassCode !== null && row.itemClassCode.trim().length > 0
        ? row.itemClassCode
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "")
        : "";
    const itemClassPartitionKey =
      normalizedSubType !== null
        ? `class:${normalizedSubType}`
        : rawItemClassSegment.length > 0
          ? `raw:${rawItemClassSegment}`
          : `coarse:${equipmentBucket}:${weaponGripBucket}`;
    const modifierPartitionKey = extractPoe2DbModifierPartitionKey(row.modifierName);
    const subgroupSegment =
      row.subgroup !== null && row.subgroup.trim().length > 0 ? row.subgroup.trim() : "";
    const groupKeyParts = [
      row.section,
      String(modType),
      itemClassPartitionKey,
      modFamiliesKey,
      requiredTagsKey,
      parsed.template,
    ];
    if (subgroupSegment.length > 0) {
      groupKeyParts.push(`subgroup:${subgroupSegment}`);
    }
    if (modifierPartitionKey.length > 0) {
      groupKeyParts.push(modifierPartitionKey);
    }
    const groupKey = groupKeyParts.join("::");

    const current = groups.get(groupKey) ?? {
      key: groupKey,
      modType,
      section: row.section,
      equipmentBucket,
      weaponGripBucket,
      template: parsed.template,
      modTags: new Set<string>(),
      applicableSubTypes: new Set<IBaseItemSubTypeType>(),
      requiredItemTags: new Set<IBaseItemStatTagType>(),
      members: [],
    };

    for (const family of row.modFamilies) {
      current.modTags.add(family);
    }
    if (normalizedSubType !== null) {
      current.applicableSubTypes.add(normalizedSubType);
    }
    for (const requiredTag of requiredTags) {
      current.requiredItemTags.add(requiredTag);
    }
    current.members.push({
      requiredLevel: row.requiredLevel ?? 1,
      weight: row.dropChanceValue ?? 0,
      ranges: parsed.ranges,
    });

    groups.set(groupKey, current);
  }

  const records: IModDbRecordType[] = [];
  let index = 0;

  for (const grouped of groups.values()) {
    const memberBuckets = new Map<
      string,
      {
        requiredLevel: number;
        weight: number;
        ranges: Array<{ min: number; max: number }>;
      }
    >();
    for (const member of grouped.members) {
      const tierSignature = `${String(member.requiredLevel)}::${JSON.stringify(member.ranges)}`;
      const current = memberBuckets.get(tierSignature);
      if (current === undefined) {
        memberBuckets.set(tierSignature, {
          requiredLevel: member.requiredLevel,
          weight: member.weight,
          ranges: member.ranges,
        });
      } else if (member.weight > current.weight) {
        current.weight = member.weight;
      }
    }

    const sortedMembers = [...memberBuckets.values()].sort((a, b) => {
      if (b.requiredLevel !== a.requiredLevel) {
        return b.requiredLevel - a.requiredLevel;
      }
      return b.weight - a.weight;
    });
    const tiers = sortedMembers.map((member, tierIndex) => {
      return {
        tier: tierIndex + 1,
        levelRequirement: member.requiredLevel,
        weight: member.weight,
        statRanges: member.ranges,
      };
    });

    const tierCount = Math.max(1, tiers.length);
    const maxLevelRequirement = tiers[0]?.levelRequirement ?? 1;
    const totalWeight = tiers.reduce((sum, tier) => {
      return sum + tier.weight;
    }, 0);

    const maxTierBySubType: Partial<Record<IBaseItemSubTypeType, number>> = {};
    for (const st of grouped.applicableSubTypes) {
      maxTierBySubType[st] = tierCount;
    }

    records.push({
      modKey: `poe2db__${grouped.section}__${String(index)}`,
      modType: grouped.modType,
      applicableSubTypes: [...grouped.applicableSubTypes],
      requiredItemTags: [...grouped.requiredItemTags],
      modTags: [...grouped.modTags].sort(),
      tierCount,
      maxLevelRequirement,
      totalWeight,
      nameTemplateKey: grouped.template,
      tiers,
      maxTierBySubType,
    });
    index += 1;
  }

  return records;
};
