# YouTube Workflow — Alles Stickman (Pipeline v8)

Deutschsprachiger faceless Erklärkanal: Menschheit, Überleben, Erfindungen, Alltag früher. Ein Video pro Woche, 6–7 Minuten, nur Stimme + Bilder.

```text
Thema → Recherche mit Story-Material → Skript nach Formel → Szenenplan → Prompts generieren
→ Phase-1-Check → 3 Cover → STOPP, Nutzer wählt → 5er-Blöcke automatisch → Bild-Textcheck
→ Stimme → Audio mit Atempausen → Alignment → Timeline mit Overlays → Render → Export mit Thumbnail-Headline
→ ehrliche Video-Review → Erkenntnisse ins System
```

Voraussetzungen: Node ≥ 24, ffmpeg/ffprobe, whisper, tesseract, `npm install`.

## Phase 1 — Planung

```bash
npm run topic:youtube -- --topic "THEMA"
npm run create:youtube -- --topic "THEMA" --title "TITEL" --week "YYYY-KWNN_DD-MM_bis_DD-MM" --slug "slug"
```

1. **Recherche** (`99-technik/RECHERCHE.md`): mindestens 5 konkrete Momente mit Zahl/Jahr/Ort/Name und URL, plus der größte Mythos.
2. **Skript** (`01-voice-script/voice-script.txt`) nach [Skript-System](../channel/SCRIPT_SYSTEM.md): du-Hook, Fallhöhe, Kette, Beweise, Rückbezug.
3. **SCRIPT_PLAN.json**: Abschnitte + `storyEngine` mit exakten Ankern.
4. **Bild-Audio-Zuordnung** (`BILD_AUDIO_ZUORDNUNG.json`): ein Bild pro Halbsatz bis Satz, Ø 3–5 s. Optional pro Bild:
   - `overlay`: `{ "text": "1707", "style": "caption", "position": "top" }`. Styles: `caption` (große gelbe Schrift), `card` (Textkarte, ersetzt das Bild), `label` (kleines Schild). Ziel: mindestens 1 Overlay pro 12 Bilder.
   - `motion`: `{ "zoomFrom": 1, "zoomTo": 1.15, "focusX": 40, "focusY": 55 }` für gezielte Fahrten auf das Wichtige.
5. **Szenenplan** (`SCENE_VISUALS_EN.json`): pro Bild englischer `brief`, `shot`, `protagonist`; 3 Cover-Ideen. Siehe [Bildwelt](../channel/VISUAL_WORLD.md).
6. **Upload-Daten** in `video.json → uploadMetadata`: Titel als Frage, Beschreibung, Tags, 2–3 Hashtags, `thumbnailText` (2–4 Wörter).
7. Prompts erzeugen und prüfen:

```bash
npm run prompts:youtube -- --dir "youtube/<week>/<slug>"
npm run validate:youtube-phase1 -- --dir "youtube/<week>/<slug>"
```

Nach bestandener Phase 1 im Chat **sofort die zwei Links** ausgeben (Google-Flow-Prompt, Voice-Skript), siehe [AGENTS.md](../AGENTS.md).

## Phase 2 — Bilder und Stimme

Google Flow arbeitet `00-bildprompts/google-flow-prompt.txt` ab:

1. Fehlt `channel/style-sheet/hauptfigur.png`, erzeugt und prüft Flow das Figurenblatt zuerst selbst; danach hängt es an jedem Bild als Referenz. Cover und vorherige Szenen sind nie Referenz.
2. Drei Cover erzeugen → **STOPP**, Nutzer wählt A/B/C → Gewinner = `Bild 01.png`, Rest löschen.
3. Danach automatisch alle Blöcke aus `batches/`, ohne Rückfragen. Pro Bild nur den Text zwischen den Markierungen einfügen.
4. Nach jedem Block: nur durchgefallene Bilder neu erzeugen (keine Strichfigur, Text im Bild, falsche Epoche, unlesbar).
5. Alle Bilder flach in `00-bildprompts/images/`, dann:

```bash
npm run validate:youtube-phase2 -- --dir "youtube/<week>/<slug>"
npm run check:youtube-images -- --dir "youtube/<week>/<slug>"
```

Genau eine Stimme in `02-audio/`. Musik nur als echte lizenzfreie Datei (z. B. YouTube Audio Library) in `YOUTUBE_RENDER_PLAN.json → backgroundMusic`. Die per Skript erzeugte Sinus-Musik (`src/audio/generate-assets.py`) vorher anhören.

## Phase 3 — Audio, Render, Export

```bash
npm run phase3:youtube -- --dir "youtube/<week>/<slug>"
```

Reihenfolge: Preflight → Phase 1/2 → **Bild-Textcheck (blockiert)** → Audio (Tempo 1,1×, Pausen bis 0,5 s bleiben, längere → 0,3 s) → Whisper-Alignment → Timeline mit Overlays und Kamerafahrten → Pacing → Render → Export.

`03-export/`: `FINAL_VIDEO.mp4`, `THUMBNAIL.png` (Bild 01 + Headline), `YOUTUBE_UPLOAD.txt`, `SUBTITLES.srt`, `TIMED_SCRIPT.txt`.

## Nach jedem Video — Review

```bash
npm run quality:init -- --dir "youtube/<week>/<slug>"
# POST_VIDEO_REVIEW.json mit echten Beobachtungen + Zeitstempeln füllen
npm run quality:close -- --dir "youtube/<week>/<slug>"
```

Regeln: [CONTINUOUS_IMPROVEMENT.md](../channel/CONTINUOUS_IMPROVEMENT.md). Eine Review mit lauter 5ern und ohne Befund ist kein Review.

## Alte Projekte

Projekte mit `pipelineVersion` ≤ 7 werden weiter nach den alten Regeln geprüft (Bildwelt v14 in `config/legacy/`). Sie werden nicht neu produziert.
