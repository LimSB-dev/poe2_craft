/**
 * Compares poe2wiki page revision metadata to a committed baseline.
 * Use after major patches; see `.cursor/rules/poe2wiki-data-sync.mdc`.
 *
 * Usage:
 *   yarn wiki:track                  — diff vs baseline (exit 1 if any page changed)
 *   yarn wiki:track --write-baseline — overwrite baseline (after manual page check)
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";

const WIKI_API = "https://www.poe2wiki.net/api.php";
const ROOT = process.cwd();
const BASELINE_PATH = path.join(ROOT, "data/poe2wiki-page-baseline.json");

/** Wiki page titles (MediaWiki `titles=`). Extend when new reference pages matter. */
const TRACKED_PAGE_TITLES: readonly string[] = [
  "Modifier",
  "Crafting",
  "Essence",
  "Currency item",
  "Omen",
  "Rarity",
];

type RevisionInfoType = {
  revid: number;
  parentid: number;
  size: number;
  timestamp: string;
};

type PageSnapshotType = {
  title: string;
  pageid: number | null;
  missing: boolean;
  revision: RevisionInfoType | null;
  /** Stable fingerprint for quick diff in logs */
  fingerprint: string;
};

type BaselineFileType = {
  wikiHost: string;
  generatedAt: string;
  pages: Record<
    string,
    {
      title: string;
      pageid: number | null;
      revision: RevisionInfoType | null;
      fingerprint: string;
    }
  >;
};

const writeBaseline = process.argv.includes("--write-baseline");

const fingerprintFor = (page: PageSnapshotType): string => {
  const payload = JSON.stringify({
    t: page.title,
    id: page.pageid,
    m: page.missing,
    r: page.revision,
  });
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
};

const buildApiUrl = (titles: readonly string[]): string => {
  const url = new URL(WIKI_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("titles", titles.join("|"));
  url.searchParams.set("prop", "revisions");
  url.searchParams.set("rvprop", "ids|timestamp|size");
  url.searchParams.set("rvslots", "main");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  return url.toString();
};

const fetchSnapshots = async (
  titles: readonly string[],
): Promise<PageSnapshotType[]> => {
  const response = await fetch(buildApiUrl(titles));
  if (!response.ok) {
    throw new Error(`Wiki API HTTP ${response.status}: ${response.statusText}`);
  }
  const data = (await response.json()) as {
    query?: {
      pages?: Array<{
        pageid?: number;
        title?: string;
        missing?: boolean;
        revisions?: Array<{
          revid: number;
          parentid: number;
          size: number;
          timestamp: string;
        }>;
      }>;
    };
  };

  const pages = data.query?.pages ?? [];
  const byTitle = new Map<string, PageSnapshotType>();

  for (const p of pages) {
    const title = p.title ?? "";
    const missing = Boolean(p.missing);
    const pageid = typeof p.pageid === "number" ? p.pageid : null;
    const rev = p.revisions?.[0];
    const revision: RevisionInfoType | null = rev
      ? {
          revid: rev.revid,
          parentid: rev.parentid,
          size: rev.size,
          timestamp: rev.timestamp,
        }
      : null;

    const snapshot: PageSnapshotType = {
      title,
      pageid,
      missing,
      revision,
      fingerprint: "",
    };
    snapshot.fingerprint = fingerprintFor(snapshot);
    if (title) {
      byTitle.set(title, snapshot);
    }
  }

  return titles.map((t) => {
    const found = byTitle.get(t);
    if (found) {
      return found;
    }
    const snapshot: PageSnapshotType = {
      title: t,
      pageid: null,
      missing: true,
      revision: null,
      fingerprint: "",
    };
    snapshot.fingerprint = fingerprintFor(snapshot);
    return snapshot;
  });
};

const loadBaseline = (): BaselineFileType | null => {
  if (!fs.existsSync(BASELINE_PATH)) {
    return null;
  }
  const raw = fs.readFileSync(BASELINE_PATH, "utf8");
  return JSON.parse(raw) as BaselineFileType;
};

const saveBaseline = (pages: PageSnapshotType[]): void => {
  const out: BaselineFileType = {
    wikiHost: "www.poe2wiki.net",
    generatedAt: new Date().toISOString(),
    pages: {},
  };
  for (const p of pages) {
    out.pages[p.title] = {
      title: p.title,
      pageid: p.pageid,
      revision: p.revision,
      fingerprint: p.fingerprint,
    };
  }
  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(`Wrote baseline: ${BASELINE_PATH}`);
};

const main = async (): Promise<void> => {
  const snapshots = await fetchSnapshots(TRACKED_PAGE_TITLES);

  if (writeBaseline) {
    saveBaseline(snapshots);
    for (const p of snapshots) {
      const rev = p.revision;
      console.log(
        `  ${p.title}: rev=${rev?.revid ?? "—"} size=${rev?.size ?? "—"} missing=${p.missing}`,
      );
    }
    return;
  }

  const baseline = loadBaseline();
  if (!baseline) {
    console.error(
      `No baseline at ${BASELINE_PATH}. Run: yarn wiki:track --write-baseline`,
    );
    process.exitCode = 2;
    return;
  }

  let changed = 0;
  const rows: string[] = [];

  for (const p of snapshots) {
    const prev = baseline.pages[p.title];
    const same = Boolean(prev && prev.fingerprint === p.fingerprint);

    const prevFp = prev?.fingerprint ?? "—";
    const status = same ? "ok" : "CHANGED";
    if (!same) {
      changed += 1;
    }
    const rev = p.revision;
    rows.push(
      `${status.padEnd(8)} ${p.title.padEnd(18)} fp ${prevFp} → ${p.fingerprint}  rev=${rev?.revid ?? "—"} size=${rev?.size ?? "—"}`,
    );
  }

  console.log("poe2wiki page drift (API revision fingerprint vs baseline)\n");
  console.log(rows.join("\n"));
  console.log("");

  if (changed > 0) {
    console.log(
      `${changed} page(s) differ from baseline. Open the wiki pages and verify layout/scripts, then sync data and run --write-baseline.`,
    );
    process.exitCode = 1;
  } else {
    console.log("No revision drift vs baseline.");
  }
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 2;
});
