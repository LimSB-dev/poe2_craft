import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { importFromPoe2DbPages } from "../src/lib/poe2db/importer";

type IImporterCliOptionsType = {
  baseUrl: string;
  paths: string[];
  outFile: string;
};

const parseArgs = (): IImporterCliOptionsType => {
  const args = process.argv.slice(2);
  const options: IImporterCliOptionsType = {
    baseUrl: "https://poe2db.tw",
    paths: ["/"],
    outFile: "data/poe2db/latest.json",
  };

  for (const arg of args) {
    if (arg.startsWith("--baseUrl=")) {
      const value = arg.replace("--baseUrl=", "").trim();
      if (value !== "") {
        options.baseUrl = value;
      }
    } else if (arg.startsWith("--paths=")) {
      const raw = arg.replace("--paths=", "").trim();
      const paths = raw
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value !== "");
      if (paths.length > 0) {
        options.paths = paths;
      }
    } else if (arg.startsWith("--out=")) {
      const outFile = arg.replace("--out=", "").trim();
      if (outFile !== "") {
        options.outFile = outFile;
      }
    }
  }

  return options;
};

const ensureParentDir = async (absoluteFilePath: string): Promise<void> => {
  const index = absoluteFilePath.lastIndexOf("/");
  const dir = index > 0 ? absoluteFilePath.slice(0, index) : absoluteFilePath;
  await mkdir(dir, { recursive: true });
};

const main = async (): Promise<void> => {
  const options = parseArgs();
  const result = await importFromPoe2DbPages({
    baseUrl: options.baseUrl,
    paths: options.paths,
  });

  const outPath = resolve(process.cwd(), options.outFile);
  await ensureParentDir(outPath);
  await writeFile(outPath, `${JSON.stringify(result, null, 2)}\n`, "utf-8");

  process.stdout.write(
    [
      "[poe2db-import]",
      `out=${outPath}`,
      `pages=${result.stats.pageCount}`,
      `anchors=${result.stats.anchorCount}`,
      `entities=${result.stats.entityCount}`,
      `patch=${result.patchVersion ?? "unknown"}`,
    ].join(" ") + "\n"
  );
};

void main();
