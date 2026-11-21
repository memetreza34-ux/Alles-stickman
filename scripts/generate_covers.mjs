import { runGeneration } from "/Users/arman/flow-mcp/dist/flow.js";
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const characterSheet = "/Users/arman/.gemini/antigravity/scratch/Alles-stickman/shorts/2026-KW45_02-11_bis_08-11/wie-funktionierten-toiletten-im-antiken-rom/00-bildprompts/hauptfigur.png";
const outDir = "/Users/arman/.gemini/antigravity/scratch/Alles-stickman/shorts/2026-KW45_02-11_bis_08-11/wie-funktionierten-toiletten-im-antiken-rom/00-bildprompts/cover-candidates";

const covers = [
  {
    id: "cover-a",
    stem: "TEMP_COVER_A",
    prompt: "Hand-drawn 2D editorial cartoon illustration in 9:16 vertical portrait format. Confident dark charcoal ink outlines with a slightly irregular hand-inked feel, clean flat color fills, soft selective shading and warm natural colors. YouTube thumbnail cover: A huge terrified stick-figure face fills the frame, eyes wide with horror as bright orange flames burst out from an ancient Roman stone toilet below, with a wooden sponge-stick lying nearby on the marble floor. High contrast, top third calm and empty for later title. The character is a simple stick figure: round white head, two black dot eyes, expressive eyebrows, small simple mouth, thin black stick arms and legs, simple round hand ends without fingers, wearing a small red scarf tied around neck. No text, letters, numbers, labels, signs, captions, logos or watermarks."
  },
  {
    id: "cover-b",
    stem: "TEMP_COVER_B",
    prompt: "Hand-drawn 2D editorial cartoon illustration in 9:16 vertical portrait format. Confident dark charcoal ink outlines with a slightly irregular hand-inked feel, clean flat color fills, soft selective shading and warm natural colors. YouTube thumbnail cover: A shocked stick figure wearing a red scarf recoils in disgust while holding up a dripping sea sponge tied to a wooden stick, with an ancient crowded Roman communal latrine visible in the background. High contrast, top third clear for later title. The character is a simple stick figure: round white head, two black dot eyes, expressive eyebrows, small simple mouth, thin black stick arms and legs, simple round hand ends without fingers, wearing a small red scarf tied around neck. No text, letters, numbers, labels, signs, captions, logos or watermarks."
  },
  {
    id: "cover-c",
    stem: "TEMP_COVER_C",
    prompt: "Hand-drawn 2D editorial cartoon illustration in 9:16 vertical portrait format. Confident dark charcoal ink outlines with a slightly irregular hand-inked feel, clean flat color fills, soft selective shading and warm natural colors. YouTube thumbnail cover: A wide-eyed stick figure sitting uncomfortably on an ancient marble latrine bench tightly sandwiched between other Romans, pointing downward in shock at a giant sewer rat emerging from the toilet hole. High contrast, top third calm for later title. The character is a simple stick figure: round white head, two black dot eyes, expressive eyebrows, small simple mouth, thin black stick arms and legs, simple round hand ends without fingers, wearing a small red scarf tied around neck. No text, letters, numbers, labels, signs, captions, logos or watermarks."
  }
];

async function main() {
  console.log("Generating 3 Cover Candidates in Google Flow (9:16)...");
  for (const c of covers) {
    console.log(`\n--- Starting ${c.stem} (${c.id}) ---`);
    const job = {
      id: c.id,
      status: "queued",
      params: {
        prompt: c.prompt,
        type: "image",
        max_credits: 25,
        aspect_ratio: "9:16",
        reference_images: [characterSheet],
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

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
