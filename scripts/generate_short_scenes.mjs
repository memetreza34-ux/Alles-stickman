import { runGeneration, getFlowState } from "/Users/arman/flow-mcp/dist/flow.js";
import { getFlowPage } from "/Users/arman/flow-mcp/dist/chrome.js";
import { existsSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
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
  console.error("Nutzung: node scripts/generate_short_scenes.mjs --dir <projekt-ordner> [--url <flow-url>] [--refs ref1,ref2] [--aspect 9:16|16:9] [--start 1] [--end N]");
  process.exit(1);
}

const projectRoot = resolve(args.dir);
const metaPath = join(projectRoot, "99-technik", "video.json");
const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, "utf8")) : {};
const aspectRatio = String(args.aspect || meta.aspectRatio || "9:16");
const totalScenes = Number(meta.plannedImageCount || 36);
const startScene = Math.max(1, Number(args.start || 1));
const endScene = Math.min(totalScenes, Number(args.end || totalScenes));
const maxAttempts = Math.max(1, Number(args.retries || 3));

const promptsDir = join(projectRoot, "00-bildprompts", "prompts");
const imagesDir = join(projectRoot, "00-bildprompts", "images");
const tempDownloadDir = join(projectRoot, "00-bildprompts", "temp_downloads");
const projectUrl = args.url || null;

const defaultRefs = [
  join(projectRoot, "00-bildprompts", "hauptfigur.png"),
  join(projectRoot, "00-bildprompts", "thumbnail-source.png")
].filter((p) => existsSync(p));

const assetReferences = args.refs
  ? String(args.refs).split(",").map((s) => s.trim()).filter(Boolean)
  : defaultRefs;

mkdirSync(imagesDir, { recursive: true });
mkdirSync(tempDownloadDir, { recursive: true });

async function ensureProjectOpen() {
  if (!projectUrl) return;
  const state = await getFlowState();
  if (!state.inProject || !state.url.includes("/project/")) {
    console.log("Re-opening project in Flow...", projectUrl);
    const page = await getFlowPage();
    await page.goto(projectUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
  }
}

async function generateSceneWithRetry(num) {
  const pad = String(num).padStart(2, "0");
  const finalPng = join(imagesDir, `Bild ${pad}.png`);

  if (existsSync(finalPng)) {
    console.log(`[${pad}/${endScene}] Already exists: Bild ${pad}.png -> skipping`);
    return true;
  }

  const promptFile = join(promptsDir, `Bild_${pad}.txt`);
  if (!existsSync(promptFile)) {
    console.error(`Prompt file not found: ${promptFile}`);
    return false;
  }

  const promptText = readFileSync(promptFile, "utf-8").trim();
  const fileStem = `Bild_${pad}`;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\n========================================`);
    console.log(`[${pad}/${endScene}] Generating Bild ${pad} (${aspectRatio}, Attempt ${attempt}/${maxAttempts})...`);
    console.log(`========================================`);

    try {
      await ensureProjectOpen();

      const job = {
        id: `scene-${pad}-run`,
        status: "queued",
        params: {
          prompt: promptText,
          type: "image",
          max_credits: 25,
          aspect_ratio: aspectRatio,
          reference_images: assetReferences,
          output_dir: tempDownloadDir,
          file_stem: fileStem
        },
        files: [],
        attempts: 0
      };

      const results = await runGeneration(job);
      if (!results || results.length === 0) {
        throw new Error(`No output file returned for Bild ${pad}`);
      }

      const downloadedFile = results[0];
      console.log(`Downloaded: ${downloadedFile}`);

      execSync(`sips -s format png "${downloadedFile}" --out "${finalPng}"`, { stdio: "inherit" });

      try {
        rmSync(downloadedFile);
      } catch (_) {}

      console.log(`SUCCESS: Saved Bild ${pad}.png`);
      return true;
    } catch (err) {
      console.error(`Attempt ${attempt} failed for Bild ${pad}: ${err.message}`);
      if (attempt < maxAttempts) {
        console.log(`Waiting 5s before retry...`);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  console.error(`FAILED permanently after ${maxAttempts} attempts: Bild ${pad}`);
  return false;
}

async function main() {
  console.log(`Starting scene generation ${startScene}..${endScene} (${aspectRatio}) using refs:`, assetReferences);
  let successCount = 0;
  let failCount = 0;

  for (let i = startScene; i <= endScene; i++) {
    const ok = await generateSceneWithRetry(i);
    if (ok) successCount++;
    else failCount++;
  }

  try {
    rmSync(tempDownloadDir, { recursive: true, force: true });
  } catch (_) {}

  console.log(`\n========================================`);
  console.log(`FINISHED: ${successCount} succeeded, ${failCount} failed.`);
  console.log(`========================================`);
  if (failCount > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
