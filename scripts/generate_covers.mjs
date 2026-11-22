import { runGeneration, getFlowState } from "/Users/arman/flow-mcp/dist/flow.js";
import { getFlowPage } from "/Users/arman/flow-mcp/dist/chrome.js";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i += 1;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (!args.dir) {
  console.error("Nutzung: node scripts/generate_covers.mjs --dir <projekt-ordner> [--url <flow-url>] [--ref <pfad-oder-asset>] [--aspect 9:16|16:9]");
  process.exit(1);
}

const projectRoot = resolve(args.dir);
const metaPath = join(projectRoot, "99-technik", "video.json");
const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, "utf8")) : {};
const aspectRatio = String(args.aspect || meta.aspectRatio || "16:9");
const promptsDir = join(projectRoot, "00-bildprompts", "prompts");
const outDir = join(projectRoot, "00-bildprompts", "cover-candidates");
const defaultCharSheet = join(projectRoot, "00-bildprompts", "hauptfigur.png");
const refImage = args.ref || (existsSync(defaultCharSheet) ? defaultCharSheet : null);

mkdirSync(outDir, { recursive: true });

const coverNames = ["COVER_A", "COVER_B", "COVER_C"];
const covers = coverNames
  .map((name, idx) => {
    const file = join(promptsDir, `${name}.txt`);
    if (!existsSync(file)) return null;
    const raw = readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((line) => !line.startsWith("#") && line.trim().length > 0)
      .join(" ")
      .trim();
    return {
      id: `cover-${String.fromCharCode(97 + idx)}`,
      stem: `TEMP_${name}`,
      prompt: raw
    };
  })
  .filter(Boolean);

if (covers.length === 0) {
  console.error(`Keine Cover-Prompts (COVER_A/B/C.txt) gefunden in: ${promptsDir}`);
  process.exit(1);
}

async function ensureProjectOpen() {
  if (!args.url) return;
  const state = await getFlowState();
  if (!state.inProject || !state.url.includes("/project/")) {
    const page = await getFlowPage();
    await page.goto(args.url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
  }
}

async function main() {
  console.log(`Generating ${covers.length} Cover Candidates (${aspectRatio}) in ${outDir}...`);
  for (const c of covers) {
    console.log(`\n--- Starting ${c.stem} (${c.id}) ---`);
    await ensureProjectOpen();
    const job = {
      id: c.id,
      status: "queued",
      params: {
        prompt: c.prompt,
        type: "image",
        max_credits: 25,
        aspect_ratio: aspectRatio,
        reference_images: refImage ? [refImage] : [],
        output_dir: outDir,
        file_stem: c.stem
      },
      files: [],
      attempts: 0
    };
    try {
      const results = await runGeneration(job);
      console.log(`Done ${c.stem}:`, results);
    } catch (err) {
      console.error(`Error generating ${c.stem}:`, err.message);
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
