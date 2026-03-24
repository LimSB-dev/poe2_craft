import { MOD_DB } from "@/lib/poe2-item-simulator/modDb";
import {
  applyStatRangesToModTemplate,
  buildModStatDisplayLines,
  formatStatRangesCell,
  getModTierDisplayRows,
} from "@/lib/poe2-item-simulator/modDbTierDisplay";

describe("modDbTierDisplay", () => {
  test("getModTierDisplayRows: synthetic tier 1 has highest level requirement", () => {
    const record = MOD_DB.records.find((r) => r.modKey === "corrupted_str_int");
    expect(record).toBeDefined();
    if (record === undefined) {
      return;
    }
    const rows = getModTierDisplayRows(record);
    expect(rows.length).toBe(record.tierCount);
    expect(rows[0]?.tier).toBe(1);
    expect(rows[0]?.levelRequirement).toBe(record.maxLevelRequirement);
    expect(rows[rows.length - 1]?.levelRequirement).toBe(1);
    expect(rows.every((row) => row.isSynthetic)).toBe(true);
  });

  test("getModTierDisplayRows: wiki-backed prefix_max_life uses real stat ranges", () => {
    const record = MOD_DB.records.find((r) => r.modKey === "prefix_max_life");
    expect(record).toBeDefined();
    if (record === undefined) {
      return;
    }
    const rows = getModTierDisplayRows(record);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.isSynthetic)).toBe(false);
    expect(rows.every((row) => row.statRanges.length > 0)).toBe(true);
  });

  test("formatStatRangesCell", () => {
    expect(formatStatRangesCell([])).toBe("");
    expect(formatStatRangesCell([{ min: 5, max: 5 }])).toBe("5");
    expect(formatStatRangesCell([{ min: 1, max: 3 }, { min: 10, max: 20 }])).toBe("1–3, 10–20");
  });

  test("applyStatRangesToModTemplate replaces # in order", () => {
    const template = "+# to ES, #% increased ES";
    expect(applyStatRangesToModTemplate(template, [{ min: 1, max: 2 }, { min: 10, max: 20 }])).toBe(
      "+(1—2) to ES, (10—20)% increased ES",
    );
  });

  test("buildModStatDisplayLines splits hybrid mods", () => {
    const template = "+# to ES, #% increased ES";
    const { lines, isPending } = buildModStatDisplayLines(template, [
      { min: 26, max: 30 },
      { min: 35, max: 38 },
    ]);
    expect(isPending).toBe(false);
    expect(lines).toEqual(["+(26—30) to ES", "(35—38)% increased ES"]);
  });
});
