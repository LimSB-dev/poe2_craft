import { getModTypeDisplayName } from "@/lib/poe2-item-simulator/modTypeLabels";

describe("modTypeLabels", () => {
  test("Korean uses 기본/훼손된 접두사·접미사 wording", () => {
    expect(getModTypeDisplayName("prefix", "ko")).toBe("기본 접두사");
    expect(getModTypeDisplayName("suffix", "ko")).toBe("기본 접미사");
    expect(getModTypeDisplayName("corruptedPrefix", "ko")).toBe("훼손된 접두사");
    expect(getModTypeDisplayName("corruptedSuffix", "ko")).toBe("훼손된 접미사");
  });

  test("unknown locale falls back to English", () => {
    expect(getModTypeDisplayName("prefix", "xx")).toBe("Standard prefix");
  });
});

