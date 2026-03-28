import { extractPoe2dbBaseItemTagsFromDetailHtml } from "@/lib/poe2db/poe2dbBaseItemTagsFromHtml";

describe("extractPoe2dbBaseItemTagsFromDetailHtml", () => {
  test("parses PoE2DB Tags table row", () => {
    const html = `<table><tr><td>Tags</td><td>str_armour, ezomyte_basetype, helmet, armour</td></tr></table>`;
    expect(extractPoe2dbBaseItemTagsFromDetailHtml(html)).toEqual([
      "str_armour",
      "ezomyte_basetype",
      "helmet",
      "armour",
    ]);
  });

  test("returns empty array when Tags row missing", () => {
    expect(extractPoe2dbBaseItemTagsFromDetailHtml("<div>no table</div>")).toEqual([]);
  });
});
