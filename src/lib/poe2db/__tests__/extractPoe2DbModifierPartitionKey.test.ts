import { extractPoe2DbModifierPartitionKey } from "@/lib/poe2db/extractPoe2DbModifierPartitionKey";

describe("extractPoe2DbModifierPartitionKey", () => {
  it("returns href slug for soul core / essence HTML names", () => {
    const html =
      '<a class="whiteitem SoulCore" href="Lesser_Desert_Rune">하위 사막 룬</a>';
    expect(extractPoe2DbModifierPartitionKey(html)).toBe("Lesser_Desert_Rune");
  });

  it("returns empty string for plain affix names so ladders still merge", () => {
    expect(extractPoe2DbModifierPartitionKey("담금질한")).toBe("");
  });

  it("handles null as empty string", () => {
    expect(extractPoe2DbModifierPartitionKey(null)).toBe("");
  });
});
