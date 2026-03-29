import fs from "fs";
import path from "path";

/**
 * `extract-poe2db-base-items` 산출물을 `data/items` 트리로 쓴다.
 * - 파일명: `extract`의 `toSnakeSubType` 접두어 + **요구 레벨 오름차순** 인덱스(예: `body_armour01.json`).
 * - `name`: `baseItemKey`에서 클래스 접두어(`{sub}_`) 제거한 짧은 식별자(예: `vile_robe`).
 * - `enable_rarity`: `normal` / `magic` / `rare` / `unique` 고정.
 *
 * `drop_level`: 별도 드랍 레벨이 추출되지 않아 `levelRequirement`와 동일하게 둔다.
 */

const ROOT = process.cwd();
const GENERATED = path.join(
  ROOT,
  "src/lib/poe2-item-simulator/data/poe2dbBaseItems.generated.json",
);
const ITEMS_ROOT = path.join(ROOT, "data/items");

type ExtractedBaseItemType = {
  baseItemKey: string;
  itemClassKey: string;
  equipmentType: string;
  levelRequirement: number;
  requiredStrength: number;
  requiredDexterity: number;
  requiredIntelligence: number;
  armour?: number;
  evasion?: number;
  energyShield?: number;
  tags?: ReadonlyArray<string>;
};

const ONE_HAND_WEAPON: ReadonlySet<string> = new Set([
  "claw",
  "dagger",
  "wand",
  "oneHandSword",
  "oneHandAxe",
  "oneHandMace",
  "sceptre",
  "spear",
  "flail",
]);

const TWO_HAND_WEAPON: ReadonlySet<string> = new Set([
  "bow",
  "staff",
  "twoHandSword",
  "twoHandAxe",
  "twoHandMace",
  "quarterstaff",
  "fishingRod",
  "crossbow",
  "trap",
  "talisman",
]);

/** `data/items/<category>/<folder>/` — 폴더명 (스네이크) */
const SUBTYPE_FOLDER: Readonly<Record<string, string>> = {
  claw: "claws",
  dagger: "daggers",
  wand: "wands",
  oneHandSword: "one_hand_swords",
  oneHandAxe: "one_hand_axes",
  oneHandMace: "one_hand_maces",
  sceptre: "sceptres",
  spear: "spears",
  flail: "flails",
  bow: "bows",
  staff: "staves",
  twoHandSword: "two_hand_swords",
  twoHandAxe: "two_hand_axes",
  twoHandMace: "two_hand_maces",
  quarterstaff: "quarterstaves",
  fishingRod: "fishing_rods",
  crossbow: "crossbows",
  trap: "traps",
  talisman: "talismans",
  quiver: "quivers",
  shield: "shields",
  buckler: "bucklers",
  focus: "foci",
  helmet: "helmets",
  bodyArmour: "body_armours",
  gloves: "gloves",
  boots: "boots",
  amulet: "amulets",
  ring: "rings",
  belt: "belts",
};

/** JSON `class` 필드 (복수 스네이크) */
const SUBTYPE_CLASS: Readonly<Record<string, string>> = {
  claw: "claws",
  dagger: "daggers",
  wand: "wands",
  oneHandSword: "one_hand_swords",
  oneHandAxe: "one_hand_axes",
  oneHandMace: "one_hand_maces",
  sceptre: "sceptres",
  spear: "spears",
  flail: "flails",
  bow: "bows",
  staff: "staves",
  twoHandSword: "two_hand_swords",
  twoHandAxe: "two_hand_axes",
  twoHandMace: "two_hand_maces",
  quarterstaff: "quarterstaves",
  fishingRod: "fishing_rods",
  crossbow: "crossbows",
  trap: "traps",
  talisman: "talismans",
  quiver: "quivers",
  shield: "shields",
  buckler: "bucklers",
  focus: "foci",
  helmet: "helmets",
  bodyArmour: "body_armours",
  gloves: "gloves",
  boots: "boots",
  amulet: "amulets",
  ring: "rings",
  belt: "belts",
};

const numStr = (n: number | undefined): string => {
  if (n === undefined || Number.isNaN(n)) {
    return "0";
  }
  return String(n);
};

/** `scripts/extract-poe2db-base-items.ts` 의 `toSnakeSubType` 와 동일해야 `baseItemKey` 접두어와 맞는다. */
const toSnakeSubType = (value: string): string => {
  return value
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const shortNameFromBaseItemKey = (baseItemKey: string, itemClassKey: string): string => {
  const subToken = toSnakeSubType(itemClassKey);
  const prefix = `${subToken}_`;
  if (baseItemKey.startsWith(prefix)) {
    return baseItemKey.slice(prefix.length);
  }
  return baseItemKey;
};

const ENABLE_RARITY: readonly string[] = ["normal", "magic", "rare", "unique"];

const indexPad = (index: number): string => {
  return (index >= 100 ? String(index) : String(index).padStart(2, "0"));
};

const getCategoryAndFolder = (
  subType: string,
): { category: string; folder: string } | null => {
  const folder = SUBTYPE_FOLDER[subType];
  if (folder === undefined || SUBTYPE_CLASS[subType] === undefined) {
    return null;
  }
  if (ONE_HAND_WEAPON.has(subType)) {
    return { category: "one_hand_weapon", folder };
  }
  if (TWO_HAND_WEAPON.has(subType)) {
    return { category: "two_hand_weapon", folder };
  }
  if (
    subType === "quiver" ||
    subType === "shield" ||
    subType === "buckler" ||
    subType === "focus"
  ) {
    return { category: "off_hand", folder };
  }
  if (subType === "helmet" || subType === "bodyArmour" || subType === "gloves" || subType === "boots") {
    return { category: "armour", folder };
  }
  if (subType === "amulet" || subType === "ring" || subType === "belt") {
    return { category: "jewellery", folder };
  }
  return null;
};

const toItemJson = (record: ExtractedBaseItemType): Record<string, unknown> => {
  const sub = record.itemClassKey;
  const classField = SUBTYPE_CLASS[sub] ?? sub;
  return {
    drop_level: numStr(record.levelRequirement),
    name: shortNameFromBaseItemKey(record.baseItemKey, sub),
    armour: numStr(record.armour),
    evasion: numStr(record.evasion),
    energy_shield: numStr(record.energyShield),
    required_level: numStr(record.levelRequirement),
    required_str: numStr(record.requiredStrength),
    required_dex: numStr(record.requiredDexterity),
    required_int: numStr(record.requiredIntelligence),
    class: classField,
    flags: [],
    tags: [...(record.tags ?? [])],
    enable_rarity: [...ENABLE_RARITY],
  };
};

const run = (): void => {
  if (!fs.existsSync(GENERATED)) {
    throw new Error(`Missing ${GENERATED} — run yarn extract:poe2db-base-items first.`);
  }
  const raw = fs.readFileSync(GENERATED, "utf8");
  const records = JSON.parse(raw) as ExtractedBaseItemType[];

  for (const ent of fs.readdirSync(ITEMS_ROOT, { withFileTypes: true })) {
    const name = ent.name;
    if (name === "_template.item.json") {
      continue;
    }
    fs.rmSync(path.join(ITEMS_ROOT, name), { recursive: true, force: true });
  }

  const byKey: ExtractedBaseItemType[] = [];
  let skipped = 0;
  for (const record of records) {
    const loc = getCategoryAndFolder(record.itemClassKey);
    if (loc === null) {
      skipped += 1;
      continue;
    }
    byKey.push(record);
  }

  const groupKey = (record: ExtractedBaseItemType): string => {
    const loc = getCategoryAndFolder(record.itemClassKey);
    return loc !== null ? `${loc.category}/${loc.folder}` : "";
  };

  const groups = new Map<string, ExtractedBaseItemType[]>();
  for (const record of byKey) {
    const k = groupKey(record);
    if (k === "") {
      continue;
    }
    const list = groups.get(k);
    if (list === undefined) {
      groups.set(k, [record]);
    } else {
      list.push(record);
    }
  }

  for (const [, list] of groups) {
    list.sort((a, b) => {
      if (a.levelRequirement !== b.levelRequirement) {
        return a.levelRequirement - b.levelRequirement;
      }
      return a.baseItemKey.localeCompare(b.baseItemKey);
    });
  }

  let written = 0;
  for (const [folderKey, list] of groups) {
    const [category, folder] = folderKey.split("/");
    const dir = path.join(ITEMS_ROOT, category, folder);
    fs.mkdirSync(dir, { recursive: true });
    const subType = list[0]?.itemClassKey;
    if (subType === undefined) {
      continue;
    }
    const prefix = toSnakeSubType(subType);
    list.forEach((record, i) => {
      const fileName = `${prefix}${indexPad(i + 1)}.json`;
      const filePath = path.join(dir, fileName);
      const payload = toItemJson(record);
      fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
      written += 1;
    });
  }

  console.log(
    `Wrote ${written} files under ${path.relative(ROOT, ITEMS_ROOT)} (skipped ${skipped} unknown subTypes).`,
  );
};

run();
