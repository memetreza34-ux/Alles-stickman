# Alles Stickman — Regeln für alle Agenten (Claude, ChatGPT, Codex, Google Flow)

Ablauf und Befehle: [youtube/WORKFLOW.md](youtube/WORKFLOW.md). Neue Videos laufen mit **Pipeline v8**.

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
