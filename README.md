# Alles Stickman

Produktionsrepository für einen deutschsprachigen faceless YouTube-Erklärkanal über Menschheit, Überleben, Erfindungen, Ressourcen und Alltag früher. Ein Video pro Woche, 6–7 Minuten, Stimme + handgezeichnete Strichfiguren-Bilder.

## Aktuelle Woche und neues Video

**KW 43 · 19.–25. Oktober 2026: „Warum war Salz früher so wertvoll?“** — Phase 1 abgeschlossen, 106 Bildszenen geplant.

- [Wochenübersicht / Claude-Code-Übergabe](youtube/2026-KW43_19-10_bis_25-10/START_HERE.md)
- [Google-Flow-Bildprompt](youtube/2026-KW43_19-10_bis_25-10/warum-war-salz-frueher-so-wertvoll/00-bildprompts/google-flow-prompt.txt)
- [Deutsches Sprecher-Skript](youtube/2026-KW43_19-10_bis_25-10/warum-war-salz-frueher-so-wertvoll/01-voice-script/voice-script.txt)

Der Google-Flow-Bildprompt enthält alles in einer Datei: Stil, Figurenblatt-Prompt, drei Cover, historischen Kontext, alle Szenen, automatische 5er-Blöcke und Qualitätschecks. Den gesamten Inhalt einmal in Flow kopieren; keine weiteren Dateien oder nachgereichten Prompts nötig.

Bei jedem Video unmittelbar nach validierter Phase 1 diese beiden direkten Links **auch im Chat** ausgeben. Die Links starten weder Bildgenerierung noch Sprachaufnahme automatisch.

## Kernsystem (Pipeline v8)

- Ablauf und Befehle: [youtube/WORKFLOW.md](youtube/WORKFLOW.md)
- Regeln für Agenten: [AGENTS.md](AGENTS.md)
- Skript-Formel und Prüfwerte: [channel/SCRIPT_SYSTEM.md](channel/SCRIPT_SYSTEM.md)
- Bildwelt v15: [channel/VISUAL_WORLD.md](channel/VISUAL_WORLD.md)
- Was erfolgreiche Kanäle anders machen: [channel/REFERENCE_ANALYSIS.md](channel/REFERENCE_ANALYSIS.md)
- Kanalrichtung: [channel/CHANNEL_DIRECTION.md](channel/CHANNEL_DIRECTION.md)
- Stand: [channel/SYSTEM_STATUS.md](channel/SYSTEM_STATUS.md)

## Die wichtigsten Befehle

```bash
npm run create:youtube -- --topic "THEMA" --title "TITEL" --week "YYYY-KWNN_DD-MM_bis_DD-MM" --slug "slug"
npm run prompts:youtube -- --dir "youtube/<week>/<slug>"          # Bildprompts aus dem Szenenplan
npm run validate:youtube-phase1 -- --dir "youtube/<week>/<slug>"  # Skript, Story, Prompts prüfen
npm run check:youtube-images -- --dir "youtube/<week>/<slug>"     # Text im Bild finden (OCR)
npm run phase3:youtube -- --dir "youtube/<week>/<slug>"           # Audio, Render, Export
npm test
```

## Höchste Priorität — lernen nach jedem Video

Nach jeder fertigen MP4 folgt eine echte Analyse mit Zeitstempeln. Ursachen gehen als getestete Änderungen in Policies, Generator, Validatoren und Renderer. Neue Projekte werden blockiert, solange ein fertiges Video keine abgeschlossene Review hat. Siehe [Qualitätskreislauf](channel/CONTINUOUS_IMPROVEMENT.md) und [Erkenntnisregister](channel/IMPROVEMENT_LEDGER.json).

## Bildproduktion: genau ein Human-Gate

3 Cover → **STOPP** → Nutzer wählt A, B oder C → alle weiteren Bilder automatisch in 5er-Blöcken → Bild-Textcheck → fertig.
