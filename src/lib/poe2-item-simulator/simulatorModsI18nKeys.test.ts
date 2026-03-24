import modsEn from "../../../messages/en/simulator/mods.json";
import { MOD_DB } from "./modDb";

describe("simulator.mods i18n keys", () => {
  it("covers every modDb nameTemplateKey in en mods.json", () => {
    const keys = new Set(Object.keys(modsEn.mods));
    for (const record of MOD_DB.records) {
      expect(keys.has(record.nameTemplateKey)).toBe(true);
    }
  });
});
