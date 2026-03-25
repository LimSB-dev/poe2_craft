/**
 * `IBaseItemSubTypeType` → PoE2DB item-class wiki slug (e.g. `One_Hand_Swords`).
 *
 * Notes:
 * - Kept as slugs only (no origin/URL helpers) so the app doesn't encode external navigation flows.
 * - Used by offline import / extraction scripts.
 */
export const POE2DB_ITEM_CLASS_WIKI_SLUG_BY_SUB_TYPE: Readonly<
  Record<IBaseItemSubTypeType, string>
> = {
  claw: "Claws",
  dagger: "Daggers",
  wand: "Wands",
  oneHandSword: "One_Hand_Swords",
  oneHandAxe: "One_Hand_Axes",
  oneHandMace: "One_Hand_Maces",
  sceptre: "Sceptres",
  spear: "Spears",
  flail: "Flails",
  bow: "Bows",
  staff: "Staves",
  twoHandSword: "Two_Hand_Swords",
  twoHandAxe: "Two_Hand_Axes",
  twoHandMace: "Two_Hand_Maces",
  quarterstaff: "Quarterstaves",
  fishingRod: "Fishing_Rods",
  crossbow: "Crossbows",
  trap: "Traps",
  talisman: "Talismans",
  quiver: "Quivers",
  shield: "Shields",
  buckler: "Bucklers",
  focus: "Foci",
  gloves: "Gloves",
  boots: "Boots",
  bodyArmour: "Body_Armours",
  helmet: "Helmets",
  amulet: "Amulets",
  ring: "Rings",
  belt: "Belts",
};

