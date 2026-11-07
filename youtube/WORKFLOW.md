# YouTube Workflow — Alles Stickman (Pipeline v8)

Deutschsprachiger faceless Erklärkanal: Menschheit, Überleben, Erfindungen, Alltag früher.
- **Longform-Videos (16:9 Querformat):** 6–7 Minuten (360–420 s), Ø 3–5 s pro Bild, Recherche mit Story-Engine, 3 Cover zur Auswahl.
- **Shorts / Reels (9:16 Hochformat):** **mindestens 60 Sekunden (1 Minute) bis höchstens 90 Sekunden (1,5 Minuten) Audio** (60–90 s), **viel mehr Bilder als bei Longform-Videos** (Ø 1,5–2,8 s pro Bild, ca. 30–50 Bilder pro Short!), vertikaler Strichfiguren-Fokus, direkter Konflikt-Hook in den ersten 3 Sekunden.

```text
Phase 1: Recherche → Skript nach Formel → Szenenplan/Prompts → STIMME DIREKT GENERIEREN (stickman-user-clone 0.95x)
Phase 2: Nutzer generiert NUR DIE BILDER (Cover wählen + Szenenbilder via Google Flow / Midjourney)
Phase 3: Audio-Alignment → Overlays/Captions → Remotion Render (16:9 oder 9:16) → Export → Review
```

Voraussetzungen: Node ≥ 24, ffmpeg/ffprobe, whisper, tesseract, `npm install`.

## Format-Struktur & Ordneraufbau

Beide Formate teilen exakt dieselbe 5-stufige Ordnerstruktur mit identischer Verzeichnis- und Dateilogik:

- **Longform-Videos:** `youtube/<Woche>/<Thema-Slug>/` (z. B. `youtube/2026-KW44_26-10_bis_01-11/wie-ueberlebte-man-eine-operation-ohne-narkose/`)
- **Shorts / Reels:** `shorts/<Woche>/<Thema-Slug>/` (z. B. `shorts/2026-KW44_26-10_bis_01-11/operation-ohne-narkose-short/`)

Jedes Projekt (Longform oder Short) enthält:
1. `00-bildprompts/` — `google-flow-prompt.txt`, `images/` (Endbilder `Bild 01.png` etc.), optionale `batches/` und `prompts/`
2. `01-voice-script/` — `voice-script.txt` (lesbares Skript ohne Steuerzeichen)
3. `02-audio/` — `voice.wav` (autonom in Phase 1 generierte Stimme)
4. `03-export/` — `FINAL_VIDEO.mp4`, `SUBTITLES.srt`, `TIMED_SCRIPT.txt`, `YOUTUBE_UPLOAD.txt` (bzw. Thumbnail bei Longform)
5. `99-technik/` — `video.json`, `status.json`, `PRODUKTIONSPLAN.md`, `SCRIPT_PLAN.json`, `BILD_AUDIO_ZUORDNUNG.json`, `RECHERCHE.md`, `SCENE_VISUALS_EN.json`, `YOUTUBE_RENDER_PLAN.json`, `PHASE1_START_HERE.md`, `PHASE1_QC.md`

## Phase 1 — Planung, Skript & direkte Stimmengenerierung (Agent autonom)

```bash
# Longform-Projekt anlegen:
npm run topic:youtube -- --topic "THEMA"
npm run create:youtube -- --topic "THEMA" --title "TITEL" --week "YYYY-KWNN_DD-MM_bis_DD-MM" --slug "slug"

# ODER Short-Projekt anlegen:
npm run create:short -- --topic "THEMA" --title "TITEL" --week "YYYY-KWNN_DD-MM_bis_DD-MM" --slug "slug"
```

1. **Recherche** (`99-technik/RECHERCHE.md`): mindestens 5 konkrete Momente mit Zahl/Jahr/Ort/Name und URL, plus der größte Mythos (bei Shorts: 1 fokussiertes Kernereignis).
2. **Skript** (`01-voice-script/voice-script.txt`) nach [Skript-System](../channel/SCRIPT_SYSTEM.md): du-Hook, Fallhöhe, Kette, Beweise, Rückbezug. Bei Shorts: 60–90 s Zieldauer.
3. **SCRIPT_PLAN.json**: Abschnitte + `storyEngine` mit exakten Ankern.
4. **Bild-Audio-Zuordnung** (`BILD_AUDIO_ZUORDNUNG.json`): ein Bild pro Halbsatz bis Satz, Ø 3–5 s (Shorts: viel mehr Bilder, Ø 1,5–2,8 s, ca. 30–50 Bilder pro Short). Optional pro Bild:
   - `overlay`: `{ "text": "1707", "style": "caption", "position": "top" }`. Styles: `caption` (große gelbe Schrift), `card` (Textkarte, ersetzt das Bild), `label` (kleines Schild). Ziel: mindestens 1 Overlay pro 12 Bilder.
   - `motion`: `{ "zoomFrom": 1, "zoomTo": 1.15, "focusX": 40, "focusY": 55 }` für gezielte Fahrten auf das Wichtige.
5. **Szenenplan** (`SCENE_VISUALS_EN.json`): pro Bild englischer `brief`, `shot`, `protagonist`; 3 Cover-Ideen (bei Longform). Siehe [Bildwelt](../channel/VISUAL_WORLD.md).
6. **Upload-Daten** in `video.json → uploadMetadata`: Titel als Frage, Beschreibung, Tags, 2–3 Hashtags, `thumbnailText` (2–4 Wörter).
7. Prompts erzeugen:

```bash
npm run prompts:youtube -- --dir "youtube/<week>/<slug>"
```

8. **Verbindlich in Phase 1 — Fertige Stimme direkt generieren:**
   Der Agent erzeugt sofort das Voiceover über die lokale Apple Silicon MLX Qwen3-TTS Engine mit deiner kalibrierten Stimme:

```bash
npm run voice:youtube -- --dir "youtube/<week>/<slug>"
```

   Erzeugt `02-audio/voice.wav` mit `stickman-user-clone` (`0.95x` Tempo, feste `0.30s` Pausen, `32` Wörter/Chunk) und Broadcast Voice Boost. Dadurch steht die exakte Dauer schon in Phase 1 unverrückbar fest.

9. Phase-1-Validierung ausführen:

```bash
npm run validate:youtube-phase1 -- --dir "youtube/<week>/<slug>"
```

Nach bestandener Phase 1 im Chat **sofort die zwei Links** ausgeben (Google-Flow-Prompt, Voice-Skript), siehe [AGENTS.md](../AGENTS.md).

## Phase 2 — Reine Bildgenerierung (Nutzer-Fokus)

Der Nutzer kümmert sich **ausschließlich um die Bilder**. Es müssen keine Audios mehr aufgenommen oder Stimmen gewählt werden! Google Flow oder Midjourney arbeitet `00-bildprompts/google-flow-prompt.txt` ab:

1. Fehlt `channel/style-sheet/hauptfigur.png`, erzeugt und prüft Flow das Figurenblatt zuerst selbst; danach hängt es an jedem Bild als Referenz. Cover und vorherige Szenen sind nie Referenz.
2. Für Longform & Shorts: Drei Cover erzeugen → **STOPP**, Nutzer wählt A/B/C → Gewinner separat als `00-bildprompts/thumbnail-source.png` (bzw. im Bilderordner) speichern, Verlierer löschen.
3. Danach alle Videoszenen **ab Bild 01** in automatischen **5er-Schritten** aus `batches/` generieren, ohne Rückfragen. Pro Bild nur den Text zwischen den Markierungen einfügen.
4. Alle Bilder ordentlich nach Schema benennen (`Bild 01.png`, `Bild 02.png`, etc.).
5. Nach jedem Block: nur durchgefallene Bilder neu erzeugen (keine Strichfigur, Text im Bild, falsche Epoche, unlesbar).
6. Wenn fertig: **alles zusammen in einem einzigen flachen Ordner ablegen**: `00-bildprompts/images/` (Cover + alle durchnummerierten Szenenbilder), dann:

```bash
npm run validate:youtube-phase2 -- --dir "youtube/<week>/<slug>"
npm run check:youtube-images -- --dir "youtube/<week>/<slug>"
npm run visual-qc:init -- --dir "youtube/<week>/<slug>"
# VISUAL_QC.json nach tatsächlicher Einzelbildsichtung bearbeiten.
npm run visual-qc:check -- --dir "youtube/<week>/<slug>"
```

## Phase 3 — Audio-Alignment, Render, Export (Agent autonom)

```bash
npm run phase3:youtube -- --dir "youtube/<week>/<slug>"
```

Reihenfolge: Preflight → Phase 1/2 → **Bild-Textcheck (blockiert)** → Audio (Tempo 1,1×, Pausen bis 0,5 s bleiben, längere → 0,3 s) → Whisper-Alignment → Timeline mit Overlays und Kamerafahrten → Pacing → Render → Export.

`03-export/`: `FINAL_VIDEO.mp4`, `THUMBNAIL.png` (separates Cover + Headline), `YOUTUBE_UPLOAD.txt`, `SUBTITLES.srt`, `TIMED_SCRIPT.txt`.

## Nach jedem Video — Review

```bash
npm run quality:init -- --dir "youtube/<week>/<slug>"
# POST_VIDEO_REVIEW.json mit echten Beobachtungen + Zeitstempeln füllen
npm run quality:close -- --dir "youtube/<week>/<slug>"
```

Regeln: [CONTINUOUS_IMPROVEMENT.md](../channel/CONTINUOUS_IMPROVEMENT.md). Eine Review mit lauter 5ern und ohne Befund ist kein Review.

**Bestehende Projekte mit Cover als erster Szene bleiben kompatibel**. Zur Migration müssen `video.json`-Coverflags geändert, sämtliche Prompt-Dateien mit `npm run prompts:youtube` neu generiert und das Cover separat erzeugt werden. Kein stillschweigender Wechsel für laufende Produktionen.\n\n## Alte Projekte

Projekte mit `pipelineVersion` ≤ 7 werden weiter nach den alten Regeln geprüft (Bildwelt v14 in `config/legacy/`). Sie werden nicht neu produziert.
