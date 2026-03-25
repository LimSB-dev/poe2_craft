import simulatorEn from "@/i18n/en/simulator.json";
import { MOD_DB } from "@/lib/poe2-item-simulator/modDb";

describe("simulator.mods i18n keys", () => {
  it("covers every modDb nameTemplateKey in en simulator.json", () => {
    const keys = new Set(Object.keys(simulatorEn.mods));
    for (const record of MOD_DB.records) {
      expect(keys.has(record.nameTemplateKey)).toBe(true);
    }
  });
});

