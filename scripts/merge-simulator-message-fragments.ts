import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const LOCALES = ["en", "ko", "ja", "zh-CN"] as const;

const FRAGMENT_FILES = [
  "shell.json",
  "panels.json",
  "form.json",
  "rarity.json",
  "result.json",
  "mods.json",
  "catalog.json",
  "craftLab.json",
  "desiredModsPanel.json",
  "itemSimulatorCatalog.json",
  "itemSimulatorWorkspace.json",
  "strategyView.json",
  "rlView.json",
  "optimizerView.json",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

const deepMerge = (
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): Record<string, unknown> => {
  const out: Record<string, unknown> = { ...left };
  for (const [key, value] of Object.entries(right)) {
    const prev = out[key];
    if (isRecord(prev) && isRecord(value)) {
      out[key] = deepMerge(prev, value);
    } else {
      out[key] = value;
    }
  }
  return out;
};

const run = (): void => {
  for (const locale of LOCALES) {
    let merged: Record<string, unknown> = {};
    for (const filename of FRAGMENT_FILES) {
      const filePath = path.join(ROOT, "messages", locale, "simulator", filename);
      const raw = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(raw) as Record<string, unknown>;
      merged = deepMerge(merged, data);
    }
    const outPath = path.join(ROOT, "messages", locale, "simulator.json");
    fs.writeFileSync(outPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
    console.log(`Wrote ${outPath}`);
  }
};

run();

