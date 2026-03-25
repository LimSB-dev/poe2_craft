import {
  buildPoe2DbItemClassPageUrl,
  tryBuildPoe2DbItemClassPageUrl,
} from "@/lib/poe2db/poe2dbItemClassPageUrl";

describe("poe2dbItemClassPageUrl", () => {
  it("builds kr URL for 한글 UI locale", () => {
    expect(buildPoe2DbItemClassPageUrl("ko", "oneHandSword")).toBe(
      "https://poe2db.tw/kr/One_Hand_Swords",
    );
  });

  it("maps en to us segment on PoE2DB", () => {
    expect(buildPoe2DbItemClassPageUrl("en", "twoHandSword")).toBe(
      "https://poe2db.tw/us/Two_Hand_Swords",
    );
  });

  it("tryBuild returns null for unknown subtype string", () => {
    expect(tryBuildPoe2DbItemClassPageUrl("ko", "not_a_real_class")).toBe(null);
  });
});
