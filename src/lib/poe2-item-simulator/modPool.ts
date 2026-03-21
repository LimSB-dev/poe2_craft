import type { IModDefinition } from "./types";

export const MOD_POOL: ReadonlyArray<IModDefinition> = [
  // Prefixes (max 3 on rare, max 1 on magic; duplicates prevented by roll logic)
  { modKey: "prefix_ignition", displayName: "Ignition +% Fire Damage", tier: 3, modType: "prefix", weight: 28 },
  { modKey: "prefix_glacier", displayName: "Glacier +% Cold Damage", tier: 3, modType: "prefix", weight: 28 },
  { modKey: "prefix_ferocity", displayName: "Ferocity +% Melee Physical Damage", tier: 4, modType: "prefix", weight: 18 },
  { modKey: "prefix_sunlit", displayName: "Sunlit % Spell Power", tier: 2, modType: "prefix", weight: 34 },
  { modKey: "prefix_adrenal", displayName: "Adrenal % Attack Speed", tier: 2, modType: "prefix", weight: 32 },
  { modKey: "prefix_chronicle", displayName: "Chronicle % Mana Regeneration", tier: 1, modType: "prefix", weight: 40 },

  // Suffixes (max 3 on rare, max 1 on magic; duplicates prevented by roll logic)
  { modKey: "suffix_bastion", displayName: "Bastion +% Armor", tier: 3, modType: "suffix", weight: 26 },
  { modKey: "suffix_horizon", displayName: "Horizon +% Energy Shield", tier: 2, modType: "suffix", weight: 30 },
  { modKey: "suffix_warding", displayName: "Warding +% Chaos Resistance", tier: 4, modType: "suffix", weight: 16 },
  { modKey: "suffix_momentum", displayName: "Momentum +% Move Speed", tier: 2, modType: "suffix", weight: 34 },
  { modKey: "suffix_steady", displayName: "Steady +% Cooldown Reduction", tier: 1, modType: "suffix", weight: 42 },
  { modKey: "suffix_lifeline", displayName: "Lifeline +% Maximum Life", tier: 5, modType: "suffix", weight: 10 },
];

