/**
 * `data/generated/poe2db-mod-drop-weights.json`의 `modDbTotalWeightHintsByModKey`로
 * `src/lib/poe2-item-simulator/modDb.ts`의 `totalWeight`를 갱신한다.
 *
 * `missingWikiModIds`가 비어 있고 `suggestedTotalWeight` > 0 인 modKey만 반영한다.
 * `DRY_RUN=1` 이면 파일을 쓰지 않고 콘솔만 출력한다.
 *
 * 사용 전: `yarn extract:poe2db-mod-drop-weights` 후 `cp`로 JSON을 반영했는지 확인.
 */

import fs from "fs";
import path from "path";

const WEIGHTS_PATH = path.join(process.cwd(), "data/generated/poe2db-mod-drop-weights.json");
const MOD_DB_PATH = path.join(process.cwd(), "src/lib/poe2-item-simulator/modDb.ts");

type HintEntryType = {
  suggestedTotalWeight: number;
  missingWikiModIds: readonly string[];
};

const run = (): void => {
  if (!fs.existsSync(WEIGHTS_PATH)) {
    console.error(`Missing ${WEIGHTS_PATH}. Run yarn extract:poe2db-mod-drop-weights first.`);
    process.exit(1);
  }

  const raw = fs.readFileSync(WEIGHTS_PATH, "utf8");
  const parsed = JSON.parse(raw) as {
    modDbTotalWeightHintsByModKey?: Record<string, HintEntryType>;
  };
  const hints = parsed.modDbTotalWeightHintsByModKey;
  if (hints === undefined) {
    console.error("modDbTotalWeightHintsByModKey missing — re-run extract (schema v2).");
    process.exit(1);
  }

  const dryRun = process.env.DRY_RUN === "1";
  let content = fs.readFileSync(MOD_DB_PATH, "utf8");
  let applied = 0;
  const skipped: string[] = [];

  for (const [modKey, hint] of Object.entries(hints)) {
    if (hint.missingWikiModIds.length > 0) {
      skipped.push(`${modKey} (missing ${String(hint.missingWikiModIds.length)} tiers)`);
      continue;
    }
    if (hint.suggestedTotalWeight <= 0) {
      skipped.push(`${modKey} (suggestedTotalWeight<=0)`);
      continue;
    }
    const esc = modKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(modKey:\\s*\"${esc}\"[\\s\\S]*?totalWeight:\\s*)\\d+`, "m");
    if (!re.test(content)) {
      skipped.push(`${modKey} (no block)`);
      continue;
    }
    content = content.replace(re, `$1${String(hint.suggestedTotalWeight)}`);
    applied += 1;
  }

  if (!dryRun) {
    fs.writeFileSync(MOD_DB_PATH, content, "utf8");
  }

  console.log(
    dryRun ? `[DRY_RUN] Would update totalWeight for ${String(applied)} mods.` : `Updated totalWeight for ${String(applied)} mods.`,
  );
  if (skipped.length > 0) {
    console.log(`Skipped ${String(skipped.length)}:`, skipped.slice(0, 15).join("; "));
    if (skipped.length > 15) {
      console.log("…");
    }
  }
};

run();
