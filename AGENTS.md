# Alles Stickman — Verbindlicher 1-Phasen-Vollautopilot

Es gibt **keine getrennten 2 oder 3 Phasen und keine Zwischenfragen mehr**. Jedes neue Video (16:9 Longform oder 9:16 Short) wird vom Agenten in **einem einzigen, durchgehenden Autopilot-Lauf (7 interne Schritte)** komplett autonom erstellt, geprüft und gerendert.

## Kanalformate & Audio-Länge

1. **Longform-Videos (16:9 Querformat, 1920×1080):**
   - Zieldauer: **6–7 Minuten** (360–420 Sekunden)
   - Visueller Takt: Ø 3–5 Sekunden pro Bild
   - Struktur: Du-Hook, Kette Problem → Lösung → neues Problem, mindestens 3 belegte „Wir wissen das, weil …“-Momente, Rückbezug am Schluss
2. **Shorts / Reels (9:16 Hochformat, 1080×1920):**
   - Zieldauer: **60 bis 90 Sekunden Audio**
   - Visueller Takt: Ø 1,5–2,8 Sekunden pro Bild (ca. 30–50 Bilder pro Short), sofortiger Konflikt-Hook in den ersten 3 Sekunden

---

## Die verbindliche 7-Schritte-Chronologie (1 durchgehender Lauf)

1. **1. Thema, Recherche & Klick-Konzept (Autonom):**
   - Der Agent wählt selbstständig ein starkes, unverbrauchtes Thema, sichert alle Zahlen/Quellen in `99-technik/RECHERCHE.md` und legt Titel + Thumbnail-Konzept fest.
2. **2. Skript & Szenen-Regieplan:**
   - Skript nach [SCRIPT_SYSTEM.md](channel/SCRIPT_SYSTEM.md) schreiben (`01-voice-script/voice-script.txt`), Szenen in `99-technik/SCENE_VISUALS_EN.json` planen und Prompts erzeugen (`npm run prompts:youtube`).
3. **3. Geklonte Master-Stimme zuerst (`stickman-user-clone`):**
   - Sofortige Stimmenerzeugung über die lokale MLX Qwen3-TTS Engine (`npm run voice:youtube`) mit `stickman-user-clone` (`0.95x` Tempo, `0.30s` Pausen, `32` Wörter/Chunk) in `02-audio/voice.wav`. Damit steht das exakte Timing vor der Bildproduktion fest.
4. **4. Bildwelt-Anker & Autonome Cover-Entscheidung in Google Flow (`flow-mcp`):**
   - **Bildwelt ([VISUAL_WORLD.md](channel/VISUAL_WORLD.md)):** 2D-Tusche-Editorial-Stil v15, jeder Mensch ist dieselbe Strichfigur (Hauptfigur mit rotem Schal, Referenz `channel/style-sheet/hauptfigur.png`), Null-Text-Regel im KI-Bild (Zahlen/Begriffe kommen als `overlay` aus dem Code).
   - Der Agent öffnet via **Flow MCP** (`flow_new_project`) ein neues Projekt in Google Flow (0 Credits), generiert 3 Cover-Kandidaten (A/B/C), **prüft sie selbst visuell**, wählt das klickstärkste Cover als finales Thumbnail aus und **löscht die 2 anderen Kandidaten sofort selbst**.
5. **5. Vollautomatische Szenen-Produktion & Strenge Eigenkontrolle (`flow-mcp`):**
   - Der Agent generiert alle Szenenbilder (`Bild 01.png` bis `Bild NN.png`) mit angehängter Referenz (`channel/style-sheet/hauptfigur.png`) automatisch über `flow_agent_images` / `flow_generate` in Google Flow und lädt sie in `00-bildprompts/images/` herunter.
   - **Eigenkontrolle:** Der Agent schaut sich jedes Bild selbst an (`visual-qc`). Weicht eine Figur vom Stickman-Stil ab, fehlt ein Bild oder taucht ungeplanter Text auf, **löscht der Agent dieses Bild und generiert genau diese Szene sofort neu**, bis alle Bilder von `01` bis `NN` perfekt sind.
6. **6. Synchronisation, Motion, Overlays & Finaler Render:**
   - Audio-Alignment via Whisper, Code-Overlays/Captions, Pacing-Validierung und Remotion-Render nach `03-export/FINAL_VIDEO.mp4`, `SUBTITLES.srt`, `TIMED_SCRIPT.txt`, `YOUTUBE_UPLOAD.txt`.
7. **7. Endkontrolle & Schlüsselfertige Übergabe:**
   - Fertige MP4 ansehen und anhören (`99-technik/POST_VIDEO_REVIEW.json`), erst nach bestandener Prüfung dem Nutzer direkt das fertige Endprodukt übergeben.
