# Aktueller Systemstatus — Alles Stickman

Stand: 2026-10-05

`SYSTEM_AUDIT.md` ist der frühere Ausgangs-Audit. Dieses Dokument beschreibt den aktuellen Stand nach der Einrichtung der eigenen Bildwelt und des Google-Flow-Workflows.

## Jetzt verbindlich vorhanden

- eigene Bildwelt `alles-stickman-editorial-v1`
- `config/visual-policy.json` steht auf `READY`
- drei Cover-Kandidaten pro Video
- automatische Wahl genau eines Cover-Gewinners
- Gewinner wird `Bild 01.png`
- beide Cover-Verlierer müssen gelöscht werden
- `Bild 01.png` ist Cover und erste Videoszene
- `Bild 01.png` ist die einzige Bildreferenz für alle Folgebilder
- vorherige Szenenbilder dürfen nicht als Referenz verwendet werden
- Bild 02 bis Bild NN jeweils genau eine finale Version
- Folgebilder werden in maximal 5er-Blöcken erzeugt
- maximal 5 aktive Generationen
- finale Bilder liegen gemeinsam und flach in `00-bildprompts/images/`
- Phase-1-Validator prüft die neuen Cover-/Referenz-/5er-Block-Regeln
- Phase-2-Validator lehnt zusätzliche Bilddateien und Unterordner im finalen Bilderordner ab

## Weiterhin offen für spätere Ausbaustufen

- automatischer direkter Google-Flow-Aufruf aus Node statt Agentensteuerung
- stärkeres Research-/Fact-Check-Gate
- kanaltypisches Skript-Gate
- festes TTS-/Voice-Erzeugungssystem
- erweiterte Remotion-Motionformen
- vollständiger Upload-Paket-Generator
- Analytics-Feedbackloop

Diese offenen Punkte ändern nichts an der jetzt festgelegten Bildproduktionslogik.
