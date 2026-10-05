# YouTube Workflow — Alles Stickman

Dieses Repository ist die Produktionsbasis für den deutschsprachigen faceless YouTube-Kanal **Alles Stickman**.

Kanalthemen: Menschheit, Evolution, Überleben, Erfindungen, Ressourcen, historische Gesellschaften und ungewöhnliche Alltagsfragen.

## Grundprinzip

```text
Thema
→ Recherche / Fakten-QC
→ Voice-over-Skript
→ Bildplanung
→ 3 Cover-Kandidaten
→ 1 Cover-Gewinner
→ Gewinner = Bild 01 + einzige Bildreferenz
→ Bild 02–NN in maximal 5er-Blöcken
→ finale Voice-over-Datei
→ Audio-Optimierung
→ Wort-/Anchor-Alignment
→ Timeline
→ Pacing-QC
→ Remotion-Render
→ Export-QC
```

## 0. Einmalige Einrichtung

Die aktive Bildwelt steht in:

`config/visual-policy.json`

Aktive Style-ID:

`alles-stickman-editorial-v1`

Lokale Voraussetzungen:
- Node.js >= 24
- FFmpeg / FFprobe
- Whisper CLI (`whisper`)
- `npm install`

## 1. Thema prüfen

```bash
npm run topic:youtube -- --topic "THEMA"
```

Der Themeneditor prüft die Repo-eigene Themenhistorie und verhindert starke Doppelungen.

## 2. Projekt anlegen

```bash
npm run create:youtube -- \
  --topic "THEMA" \
  --title "TITEL" \
  --week "YYYY-KWNN_DD-MM_bis_DD-MM" \
  --slug "themen-slug"
```

Projektstruktur:

```text
youtube/<week>/<slug>/
├── 00-bildprompts/
│   ├── google-flow-prompt.txt
│   └── images/
├── 01-voice-script/
│   └── voice-script.txt
├── 02-audio/
├── 03-export/
└── 99-technik/
    ├── video.json
    ├── BILD_AUDIO_ZUORDNUNG.json
    ├── RECHERCHE.md
    ├── PHASE1_QC.md
    ├── PRODUKTIONSPLAN.md
    ├── YOUTUBE_CHAPTERS.json
    ├── YOUTUBE_RENDER_PLAN.json
    └── status.json
```

## 3. Phase 1 — Recherche, Skript und Bildplan

Phase 1 muss vollständig festlegen:
- Kernfrage
- belastbare Faktenbasis
- Unsicherheiten/Vereinfachungen
- Voice-over-Skript
- Ziel-Länge
- inhaltsgetriebene Bildzahl
- Audio-Anker
- Visual Purpose
- Topic Anchor
- Visual Form
- Planned Hold
- vollständige Bildprompts
- Render-/SFX-Plan

Bildplan-Regeln:
- keine starre Bildzahl
- 1 Bild = 1 klare visuelle Funktion
- durchschnittlich ca. 4,5–7,5 s pro Bild
- ab 9 s Split prüfen
- ab 11 s Split stark bevorzugen
- 16 s Hard-Max
- keine Füllbilder

Vor Asset-Erzeugung:

```bash
npm run validate:youtube-phase1 -- --dir "youtube/<week>/<slug>"
```

## 4. Google Flow — verbindlicher 5-Phasen-Ablauf

Masterprompt:

`00-bildprompts/google-flow-prompt.txt`

### Phase 1: Plan laden
- aktive Bildwelt laden
- Skript laden
- Bildplan laden
- NN bestimmen

### Phase 2: exakt 3 Cover erzeugen
Temporär:
- `TEMP_COVER_A.png`
- `TEMP_COVER_B.png`
- `TEMP_COVER_C.png`

Bild 01 ist Cover und erste Videoszene.

### Phase 3: Gewinner wählen
Der Agent wählt selbstständig genau einen Gewinner nach:
- Verständlichkeit
- Neugier
- Thumbnail-Lesbarkeit
- Stiltreue
- saubere Figuren/Textdarstellung
- sachliche/historische Plausibilität

Danach:
- Gewinner → `Bild 01.png`
- beide Verlierer löschen
- keine Kopien der Verlierer behalten
- `Bild 01.png` als einzige Bildreferenz sperren

### Phase 4: Restbilder in maximal 5er-Blöcken
Danach ohne Nutzer-Rückfrage:

```text
Bild 02–06
Bild 07–11
Bild 12–16
...
bis Bild NN
```

Der letzte Block darf kleiner sein.

Regeln:
- maximal 5 aktive Generierungen
- jedes Nicht-Cover-Bild genau einmal
- keine A/B-Alternativen
- ausschließlich `Bild 01.png` als Bildreferenz
- kein vorheriges Szenenbild als Referenz
- individuelle Komposition passend zum Inhalt

Nur bei technischem Fehlschlag oder eindeutig unbrauchbarem Output darf exakt dieselbe Bildnummer korrigierend neu erzeugt werden.

### Phase 5: finaler Ordner
Nach Abschluss darf `00-bildprompts/images/` ausschließlich enthalten:

```text
Bild 01.png
Bild 02.png
Bild 03.png
...
Bild NN.png
```

Keine:
- TEMP-Dateien
- Cover-Verlierer
- Varianten
- Unterordner
- Zwischenbilder
- zusätzliche Thumbnails

## 5. Referenzbild-Regel

Für jedes Video gilt:

**Nur der ausgewählte Cover-Gewinner `Bild 01.png` ist Bildreferenz für alle weiteren Szenen.**

Er stabilisiert:
- Linienführung
- Gesichtslogik
- Figurenwelt
- Farbgefühl
- Illustrationssprache

Er darf nicht dazu führen, dass alle Szenen dieselbe Pose, Kamera oder Komposition kopieren.

## 6. Eigene Bildwelt

Verbindlich ist:

`config/visual-policy.json`

Zusätzliche Dokumentation:

`channel/VISUAL_WORLD.md`

Grundprinzipien:
- 2D handgezeichnet wirkender Editorial-Stickman-Stil
- dunkle leicht unregelmäßige Konturen
- warme Elfenbein-Köpfe
- starke Mimik
- reduzierte Anatomie
- gedämpfte natürliche Farbpalette
- historisch lesbare Kleidung und Requisiten
- reduzierte, aber informative Hintergründe
- Karten, Prozesse, Vergleiche und Diagramme ausdrücklich erlaubt
- keine direkte Kopie eines Referenzkanals

## 7. Phase 2 — Assets

Finale Bilder:

`00-bildprompts/images/Bild 01.png` bis `Bild NN.png`

Finales Nutzer-Voice-over: genau eine Audiodatei unter:

`02-audio/`

Das Nutzeroriginal wird nie überschrieben.

Prüfung:

```bash
npm run validate:youtube-phase2 -- --dir "youtube/<week>/<slug>"
```

## 8. Phase 3 — Audio, Alignment, Timeline und Render

```bash
npm run phase3:youtube -- --dir "youtube/<week>/<slug>"
```

Reihenfolge:
1. Preflight
2. Phase-1-Gate
3. Phase-2-Gate
4. Audio intern optimieren
5. Whisper auf optimiertem Audio
6. Bildanker ausrichten
7. finale Timeline bauen
8. Pacing prüfen
9. Pre-Render-QC
10. Remotion rendern
11. Thumbnail aus Bild 01 kopieren
12. Post-Render-QC

Nur vorbereiten:

```bash
npm run phase3:youtube -- --dir "youtube/<week>/<slug>" --prepare-only
```

## Audio-Standard

- 1,10× Playback bei erhaltener Tonhöhe
- lange Pausen kürzen
- Endstille entfernen
- Ziel −16 LUFS
- True Peak max. −1,5 dBTP
- 48 kHz
- Nutzeroriginal unverändert

## Schluss-Hold

Nach dem letzten gesprochenen Wort bleibt das letzte Bild standardmäßig 1,3 s sichtbar. Zulässig: 1,2–1,5 s.

## Definition of Done

Ein Video ist erst fertig, wenn:
- Thema geprüft ist
- Recherche/Skript/Bildplan fertig sind
- aktive Bildwelt `READY` ist
- genau 3 Cover-Kandidaten erzeugt wurden
- genau 1 Cover-Gewinner als `Bild 01.png` übrig bleibt
- die 2 Cover-Verlierer gelöscht sind
- Bild 01 als einzige Bildreferenz für Bild 02–NN verwendet wurde
- Bild 02–NN in maximal 5er-Blöcken erzeugt wurden
- finale Bilder lückenlos benannt sind
- alle finalen Bilder in einem flachen Ordner liegen
- genau eine Nutzerstimme vorliegt
- Audio-QC bestanden ist
- echte Wortzeiten vorliegen
- Timeline keine Lücken/Überlappungen hat
- Pacing bestanden ist
- Render existiert
- Thumbnail aus Bild 01 erzeugt wurde
- Post-Render-QC bestanden ist
