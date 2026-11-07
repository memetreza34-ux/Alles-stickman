# Alles Stickman — Regeln für alle Agenten (Claude, ChatGPT, Codex, Google Flow)

Ablauf und Befehle: [youtube/WORKFLOW.md](youtube/WORKFLOW.md). Neue Videos und Shorts laufen mit **Pipeline v8**.

## Kanalformate & Audio-Länge

1. **Longform-Videos (16:9 Querformat):**
   - Zieldauer: **6–7 Minuten** (360–420 Sekunden)
   - Visueller Takt: Ø 3–5 Sekunden pro Bild
   - Struktur: Du-Hook, Kette, 3 belegte Momente, Rückbezug
2. **Shorts / Reels (9:16 Hochformat, 1080×1920):**
   - Zieldauer: **mindestens 60 Sekunden (1 Minute) bis höchstens 90 Sekunden (1,5 Minuten) Audio** (60–90 s)
   - Schneller Bildtakt: Ø 2–3,5 Sekunden pro Bild
   - Vertikale Bildkomposition, sofortiger Konflikt-Hook in den ersten 3 Sekunden

## Verbindlicher 3-Phasen-Ablauf (wer macht was)

- **Phase 1 (Agent autonom):**
  - Thema prüfen, Recherche und Skript schreiben.
  - Bildprompts für Google Flow erstellen (`npm run prompts:youtube`).
  - **Direkte Stimmenerzeugung in Phase 1:** Der Agent generiert sofort das Voiceover über die lokale MLX Qwen3-TTS Engine (`npm run voice:youtube`) mit `stickman-user-clone` (`0.95x` Tempo, `0.30s` Pausen, `32` Wörter/Chunk).
  - Dadurch stehen Audiodauer, Timing und Satzpausen bereits vor der Bildproduktion unverrückbar fest.
- **Phase 2 (Nutzer-Fokus):**
  - Der Nutzer kümmert sich **ausschließlich um die Generierung der Bilder** (bei Longform: 3 Cover erzeugen, 1 auswählen, danach 5er-Blöcke; bei Shorts: direkte 9:16-Bilder).
  - Der Nutzer muss **keine** Audios aufnehmen oder Stimmdateien anfassen.
- **Phase 3 (Agent autonom):**
  - Audio-Alignment via Whisper, Overlays/Captions, Pacing-Validierung, Remotion-Rendering und Post-Video-Review.

## HÖCHSTE PRIORITÄT: Jedes Video besser als das letzte

- Jede fertige MP4 **wirklich ansehen und anhören**, Befunde mit Zeitstempel/Bildnummer in `99-technik/POST_VIDEO_REVIEW.json`. Regeln: [CONTINUOUS_IMPROVEMENT.md](channel/CONTINUOUS_IMPROVEMENT.md).
- Ursachen zentral beheben (Policy, Generator, Validator, Renderer), nicht nur im einen Video.
- Nie behaupten, ein Video geprüft zu haben, wenn nur Dateinamen, Screenshots, eine komprimierte Kopie oder Tests vorliegen. Keine erfundenen Analytics.
- `create:youtube` blockiert neue Projekte, solange ein lokal fertiges Video keine abgeschlossene Review hat.

## Skript

Formel und Prüfwerte: [SCRIPT_SYSTEM.md](channel/SCRIPT_SYSTEM.md). Kurz: du-Hook heute ↔ damals, Fallhöhe, Kette Problem → Lösung → neues Problem, mindestens 3 belegte „Wir wissen das, weil …“-Momente, Rückbezug am Schluss. Jede Zahl steht mit URL in `RECHERCHE.md`.

## Bilder

Regeln: [VISUAL_WORLD.md](channel/VISUAL_WORLD.md).

- Bildprompts **nie von Hand schreiben**. `SCENE_VISUALS_EN.json` ausfüllen, dann `npm run prompts:youtube`. Der Validator lehnt veraltete oder geänderte Prompt-Dateien ab.
- Der Google-Flow-Master ist **ein einziges vollständig kopierbares Dokument** mit Figurenblatt, Stil, drei Covers, allen Szenen und QC. Batch-Dateien sind optional.
- Für jedes neue und das migrierte Salzprojekt: nach tatsächlicher Bildproduktion `visual-qc:init`, alle PNGs wirklich ansehen und das SHA256-gebundene Manifest ehrlich freigeben. `visual-qc:check` muss vor jedem Render bestehen. Keine automatisch erfundene Sicht-QC.
- Briefs auf Englisch, konkret, ohne Dateinamen, Zeiten, Versionen oder Labels.
- Kein Text im KI-Bild. Zahlen und Begriffe als `overlay` in `BILD_AUDIO_ZUORDNUNG.json`, Thumbnail-Headline in `uploadMetadata.thumbnailText`.
- Jeder Mensch ist dieselbe Strichfigur, in jeder Kultur und Epoche, auch die Hände.
- Nur Bilder generieren, wenn der Nutzer Bilder will. Bei einer reinen Prompt-Anfrage nur Prompts liefern.

## Google Flow: genau ein Human-Gate

3 Cover → **HARD STOP** → Nutzer wählt A/B/C → danach alle 5er-Blöcke automatisch, ohne Rückfrage und ohne `WEITER`. Cover und vorherige Szenen nie als Referenz, nur `channel/style-sheet/hauptfigur.png` (erzeugt Flow beim ersten Mal selbst). Am Ende `npm run check:youtube-images` und gefundene Bilder neu erzeugen.

## Phase-1-Abschluss: SOFORT ZWEI LINKS IM CHAT

Die erste Antwort nach bestandener Phase 1 beginnt mit zwei direkt anklickbaren Links zu den Dateien **des gerade erstellten Videos**. **Diese Links IM CHAT anzeigen**, nicht nur ins Repo schreiben: Der Nutzer arbeitet oft unterwegs am Tablet oder Smartphone. Keine Platzhalter, keine Ordner- oder Template-Links, keine Nachfrage.

> Phase 1 ist bereit.
>
> [Google-Flow-Prompt öffnen](https://github.com/memetreza34-ux/Alles-stickman/blob/main/youtube/<week>/<slug>/00-bildprompts/google-flow-prompt.txt) · [Voice-over-Skript öffnen](https://github.com/memetreza34-ux/Alles-stickman/blob/main/youtube/<week>/<slug>/01-voice-script/voice-script.txt)

Links werden zentral von `src/lib/phase1-handoff.js` erzeugt (`npm run handoff:youtube`). Vorher prüfen, dass beide Dateien existieren. Die Links öffnen nur den Text auf GitHub; sie starten weder Flow noch TTS.

## Upload

Titel als klare Frage, Beschreibung mit 2–3 passenden Hashtags (`#AllesStickman` + Thema), keine `#Shorts`/`#viral`-Wände. Hashtags kommen nicht in die SRT.
