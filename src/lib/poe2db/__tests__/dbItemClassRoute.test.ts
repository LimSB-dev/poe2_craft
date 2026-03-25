import { parseDbItemClassRouteParam } from "@/lib/poe2db/dbItemClassRoute";

describe("parseDbItemClassRouteParam", () => {
  it("accepts internal camelCase keys", () => {
    expect(parseDbItemClassRouteParam("claw")).toBe("claw");
    expect(parseDbItemClassRouteParam("oneHandSword")).toBe("oneHandSword");
  });

  it("accepts PoE2DB wiki slugs", () => {
    expect(parseDbItemClassRouteParam("Claws")).toBe("claw");
    expect(parseDbItemClassRouteParam("One_Hand_Swords")).toBe("oneHandSword");
  });

  it("returns null for unknown segments", () => {
    expect(parseDbItemClassRouteParam("NotAClass")).toBe(null);
    expect(parseDbItemClassRouteParam("")).toBe(null);
  });
});
