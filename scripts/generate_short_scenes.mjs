import { runGeneration, getFlowState } from "/Users/arman/flow-mcp/dist/flow.js";
import { getFlowPage } from "/Users/arman/flow-mcp/dist/chrome.js";
import { existsSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const projectRoot = "/Users/arman/.gemini/antigravity/scratch/Alles-stickman/shorts/2026-KW45_02-11_bis_08-11/wie-funktionierten-toiletten-im-antiken-rom";
const promptsDir = join(projectRoot, "00-bildprompts/prompts");
const imagesDir = join(projectRoot, "00-bildprompts/images");
const tempDownloadDir = join(projectRoot, "00-bildprompts/temp_downloads");
const projectUrl = "https://flow.google.com/project/fdfc483c-0f33-4bc0-809a-6b968ae7f753";

// In-project asset references (Model Sheet and Cover A)
const assetReferences = ["asset:fm-scene-01-test-ref1", "asset:fm-scene-01-test-ref2"];

mkdirSync(imagesDir, { recursive: true });
mkdirSync(tempDownloadDir, { recursive: true });

async function ensureProjectOpen() {
  const state = await getFlowState();
  if (!state.inProject || !state.url.includes("/project/")) {
    console.log("Re-opening project in Flow...", projectUrl);
    const page = await getFlowPage();
    await page.goto(projectUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
  }
}

async function generateSceneWithRetry(num, maxAttempts = 3) {
  const pad = String(num).padStart(2, "0");
  const finalPng = join(imagesDir, `Bild ${pad}.png`);

  if (existsSync(finalPng)) {
    console.log(`[${pad}/36] Already exists: Bild ${pad}.png -> skipping`);
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
    console.log(`[${pad}/36] Generating Bild ${pad} (Attempt ${attempt}/${maxAttempts})...`);
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
          aspect_ratio: "9:16",
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

      // Convert to PNG using macOS built-in sips tool
      execSync(`sips -s format png "${downloadedFile}" --out "${finalPng}"`, { stdio: "inherit" });

      try {
        rmSync(downloadedFile);
      } catch (_) {}

      console.log(`SUCCESS: Saved Bild ${pad}.png`);
      return true;
    } catch (err) {
      console.error(`Attempt ${attempt} failed for Bild ${pad}: ${err.message}`);
      if (attempt < maxAttempts) {
        console.log("Waiting 6s before retrying...");
        await new Promise(r => setTimeout(r, 6000));
      }
    }
  }

  return false;
}

async function main() {
  console.log("Starting reliable generation of 36 scenes in Google Flow...");
  console.log(`Using Flow In-Project Asset References:`, assetReferences);

  let successCount = 0;
  for (let i = 1; i <= 36; i++) {
    const ok = await generateSceneWithRetry(i, 3);
    if (ok) successCount++;
    // Polite breather between scenes
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n========================================`);
  console.log(`Finished! Total ready: ${successCount}/36 scenes.`);
  console.log(`========================================`);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
