# Aktueller Systemstatus — Alles Stickman

Stand: 2026-10-06

`SYSTEM_AUDIT.md` ist der frühere Ausgangs-Audit. Dieses Dokument beschreibt den aktuellen verbindlichen Stand.

## Jetzt verbindlich vorhanden

- eigene Bildwelt `alles-stickman-editorial-v1`
- `config/visual-policy.json` steht auf `READY`
- genau drei Cover-Kandidaten pro Video
- **Google Flow wählt selbstständig genau einen Cover-Gewinner**
- Auswahlhoheit: `google-flow`
- der Nutzer muss keinen Cover-Kandidaten auswählen und wird nicht nach einem Favoriten gefragt
- Gewinner wird `Bild 01.png`
- beide Cover-Verlierer werden gelöscht
- `Bild 01.png` ist Cover und erste Videoszene
- **Bild 01 wird nicht als Referenzbild für Folgebilder verwendet**
- auch andere Cover und vorherige Szenenbilder dürfen nicht als Referenz verwendet werden
- Referenzmodus: `none`
- für Bild 02 bis Bild NN werden überhaupt keine Bildreferenzen benutzt
- Konsistenz entsteht ausschließlich über `config/visual-policy.json` und vollständige individuelle Textprompts
- Bild 02 bis Bild NN jeweils genau eine finale Version
- Folgebilder werden in maximal 5er-Blöcken erzeugt
- maximal 5 aktive Generationen
- flexible Visual Forms: Szenen, Objekte, Karten, Diagramme, Multi-Panels, Prozesse, Text-/Zahlenbilder usw.
- finale Bilder liegen gemeinsam und flach in `00-bildprompts/images/`
- Phase-1-Validator prüft Cover-Autowahl, Referenzfreiheit und 5er-Block-Regeln
- Phase-2-Validator lehnt zusätzliche Bilddateien und Unterordner im finalen Bilderordner ab
- Export erzeugt Video, Thumbnail, Upload-Metadaten, SRT-Untertitel und Zeitstempel-Skript
- verbindliches Skript-System in `config/script-policy.json`
- feste Struktur: Hook → Setup → Hauptteil → Auflösung → Schluss
- `SCRIPT_PLAN.json` pro Video mit exakten Abschnittsankern
- Phase-1-Gate prüft Skriptstruktur, Hook-Start, generische Intros, Wortdichte, Satzlänge und exakte Wiederholungen

## Warum keine Bildreferenz mehr

Das Cover ist auf Klickstärke optimiert. Als Referenzvorlage kann es spätere Karten, Diagramme, Multi-Panels und andere Erklärformen unnötig in dieselbe Bildkomposition drücken. Deshalb wird nur die **Designsprache** konstant gehalten, nicht ein konkretes Ausgangsbild.

## Weiterhin offen für spätere Ausbaustufen

- automatischer direkter Google-Flow-Aufruf aus Node statt Agentensteuerung
- stärkeres Research-/Fact-Check-Gate
- festes TTS-/Voice-Erzeugungssystem
- erweiterte Remotion-Motionformen
- Analytics-Feedbackloop

Diese offenen Punkte ändern nichts an der jetzt festgelegten Bildproduktionslogik.
