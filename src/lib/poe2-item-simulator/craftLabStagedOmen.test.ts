import {
  resolveStagedAbyssOmenForPreservedBone,
  toAbyssOmenForBone,
} from "./craftLabStagedOmen";

describe("craftLabStagedOmen — preserved bone omen resolution", () => {
  describe("resolveStagedAbyssOmenForPreservedBone", () => {
    it("returns null when only ritual omens are staged", () => {
      expect(
        resolveStagedAbyssOmenForPreservedBone(["omen_whittling"]),
      ).toBeNull();
      expect(
        resolveStagedAbyssOmenForPreservedBone([
          "omen_whittling",
          "omen_sanctification",
        ]),
      ).toBeNull();
    });

    it("returns null when only omen_light is staged (light is annulment-only, not bone)", () => {
      expect(
        resolveStagedAbyssOmenForPreservedBone(["omen_light"]),
      ).toBeNull();
    });

    it("ignores omen_light so a bone omen after it still applies", () => {
      expect(
        resolveStagedAbyssOmenForPreservedBone([
          "omen_light",
          "omen_sinistral_necromancy",
        ]),
      ).toBe("omen_sinistral_necromancy");
    });

    it("prefers omen_putrefaction over other desecration omens regardless of order", () => {
      expect(
        resolveStagedAbyssOmenForPreservedBone([
          "omen_light",
          "omen_sinistral_necromancy",
          "omen_putrefaction",
        ]),
      ).toBe("omen_putrefaction");
      expect(
        resolveStagedAbyssOmenForPreservedBone([
          "omen_putrefaction",
          "omen_sinistral_necromancy",
        ]),
      ).toBe("omen_putrefaction");
    });

    it("picks first family omen in staging order when multiple are listed", () => {
      expect(
        resolveStagedAbyssOmenForPreservedBone([
          "omen_liege",
          "omen_blackblooded",
        ]),
      ).toBe("omen_liege");
      expect(
        resolveStagedAbyssOmenForPreservedBone([
          "omen_blackblooded",
          "omen_liege",
        ]),
      ).toBe("omen_blackblooded");
    });

    it("picks first necromancy omen in staging order (sinistral vs dextral mutually exclusive per bone)", () => {
      expect(
        resolveStagedAbyssOmenForPreservedBone([
          "omen_dextral_necromancy",
          "omen_sinistral_necromancy",
        ]),
      ).toBe("omen_dextral_necromancy");
      expect(
        resolveStagedAbyssOmenForPreservedBone([
          "omen_sinistral_necromancy",
          "omen_dextral_necromancy",
        ]),
      ).toBe("omen_sinistral_necromancy");
    });

    it("putrefaction wins over family omens", () => {
      expect(
        resolveStagedAbyssOmenForPreservedBone([
          "omen_blackblooded",
          "omen_putrefaction",
        ]),
      ).toBe("omen_putrefaction");
    });

    it("allows ritual + abyss: ritual ignored here; first relevant abyss wins by tier rules", () => {
      expect(
        resolveStagedAbyssOmenForPreservedBone([
          "omen_whittling",
          "omen_abyssal_echoes",
        ]),
      ).toBe("omen_abyssal_echoes");
    });

    it("necromancy before abyssal_echoes in list wins", () => {
      expect(
        resolveStagedAbyssOmenForPreservedBone([
          "omen_abyssal_echoes",
          "omen_sinistral_necromancy",
        ]),
      ).toBe("omen_sinistral_necromancy");
    });
  });

  describe("toAbyssOmenForBone", () => {
    it("maps abyss ids and nulls ritual ids", () => {
      expect(toAbyssOmenForBone("omen_putrefaction")).toBe("omen_putrefaction");
      expect(toAbyssOmenForBone("omen_whittling")).toBeNull();
    });
  });
});
