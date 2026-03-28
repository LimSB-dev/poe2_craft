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

  it("strips HTML tags for names with angle brackets but no href (fallback key)", () => {
    expect(extractPoe2DbModifierPartitionKey("<span>담금질한</span>")).toBe("담금질한");
  });

  it("truncates stripped fallback to 200 chars", () => {
    const long = `<b>${"x".repeat(250)}</b>`;
    const out = extractPoe2DbModifierPartitionKey(long);
    expect(out.length).toBe(200);
    expect(out.startsWith("x")).toBe(true);
  });
});
