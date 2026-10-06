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
→ Google Flow wählt selbst 1 Cover-Gewinner
→ Gewinner = Bild 01
→ 2 Cover-Verlierer löschen
→ Bild 02–NN ohne Bildreferenz in maximal 5er-Blöcken
→ finale Voice-over-Datei
→ Audio-Optimierung
→ Wort-/Anchor-Alignment
→ Timeline
→ Pacing-QC
→ Remotion-Render
→ Export-QC
→ fertiges YouTube-Uploadpaket
```

## 0. Einmalige Einrichtung

Aktive Bildwelt:
- `config/visual-policy.json`
- Style-ID: `alles-stickman-editorial-v1`

Lokale Voraussetzungen:
- Node.js >= 24
- FFmpeg / FFprobe
- Whisper CLI (`whisper`)
- `npm install`

## 1. Thema prüfen

```bash
npm run topic:youtube -- --topic "THEMA"
```

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
    ├── SCRIPT_PLAN.json
    ├── RECHERCHE.md
    ├── PHASE1_QC.md
    ├── PRODUKTIONSPLAN.md
    ├── YOUTUBE_CHAPTERS.json
    ├── YOUTUBE_RENDER_PLAN.json
    └── status.json
```

## 3. Phase 1 — Recherche, Skript, Bildplan und Upload-Metadaten

Pflicht:
- Kernfrage
- belastbare Faktenbasis
- Unsicherheiten/Vereinfachungen
- Voice-over-Skript
- `SCRIPT_PLAN.json` mit Hook, Setup, Hauptteil, Auflösung und Schluss
- kanaltypisches Skript-Gate nach `config/script-policy.json`
- Ziel-Länge
- inhaltsgetriebene Bildzahl
- Audio-Anker
- Visual Purpose
- Topic Anchor
- Visual Form
- Planned Hold
- vollständige Bildprompts
- Render-/SFX-Plan
- finaler YouTube-Titel
- finale YouTube-Beschreibung
- optionale Tags

Upload-Daten stehen in `99-technik/video.json` unter `uploadMetadata`.

Bildplan-Regeln:
- keine starre Bildzahl
- 1 Bild = 1 klare visuelle Funktion oder zusammengehörige Informationseinheit
- durchschnittlich ca. 4,5–7,5 s pro Bild
- ab 9 s Split prüfen
- ab 11 s Split stark bevorzugen
- 16 s Hard-Max
- keine Füllbilder

Skriptregeln:
- Hook beginnt direkt, ohne Begrüßung oder „In diesem Video ...“
- Setup bleibt kurz
- Hauptteil erzählt eine Entwicklung statt einer bloßen Faktenliste
- alle ca. 20–40 Sekunden neuer Informationsimpuls
- Auflösung beantwortet die Hook-Frage
- Schluss sehr kurz, kein langes Outro
- natürliches Deutsch, keine KI-Floskeln
- 32 Wörter pro Satz Hard-Max
- Wortdichte ungefähr 115–180 Wörter/Minute
- möglichst jeder Absatz muss visualisierbar sein

Details: `channel/SCRIPT_SYSTEM.md`

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

### Phase 3: Google Flow wählt selbst den Gewinner
Google Flow bewertet die drei Kandidaten selbstständig nach:
- Verständlichkeit
- Neugier
- Thumbnail-Lesbarkeit
- Stiltreue
- sauberer Figuren-/Textdarstellung
- sachlicher/historischer Plausibilität

**Der Nutzer wählt nicht manuell und wird nicht nach einem Favoriten gefragt.** Die Auswahlhoheit liegt vollständig bei Google Flow.

Danach:
- Gewinner → `Bild 01.png`
- beide Verlierer löschen
- keine Kopien der Verlierer behalten

### Phase 4: Bild 02–NN ohne Bildreferenz
Danach ohne Nutzer-Rückfrage in maximalen 5er-Blöcken:

```text
Bild 02–06
Bild 07–11
Bild 12–16
...
bis Bild NN
```

Regeln:
- maximal 5 aktive Generationen
- jedes Nicht-Cover-Bild genau einmal
- keine A/B-Alternativen
- **keine Bildreferenz verwenden**
- weder Bild 01 noch Cover-Verlierer noch vorherige Szenenbilder als Vorlage benutzen
- Konsistenz ausschließlich über `config/visual-policy.json` + vollständigen Textprompt des jeweiligen Bildes
- individuelle Komposition passend zum Inhalt
- Visual Form frei nach Erklärwert wählen

Nur bei technischem Fehlschlag oder eindeutig unbrauchbarem Output darf exakt dieselbe Bildnummer neu erzeugt werden.

### Phase 5: finaler Ordner
Nach Abschluss darf `00-bildprompts/images/` ausschließlich enthalten:

```text
Bild 01.png
Bild 02.png
Bild 03.png
...
Bild NN.png
```

Keine TEMP-Dateien, Cover-Verlierer, Varianten, Unterordner, Zwischenbilder oder Zusatz-Thumbnails.

## 5. Konsistenz ohne Referenzbild

Für Folgebilder gilt ausdrücklich:

**Kein generiertes Bild dient als Referenzvorlage.** `referenceMode` ist verbindlich `none`.

Die gemeinsame Alles-Stickman-Welt wird gehalten durch:
- feste Linienlogik
- feste Grundpalette
- feste Figuren-/Gesichtslogik
- feste Text-/Labelbehandlung
- feste Informationsdesign-Regeln
- vollständige individuelle Prompts

Warum: Ein Cover ist auf Klickstärke optimiert und kann Karten, Diagramme, Multi-Panels oder Objektgrafiken unnötig in eine ähnliche Komposition drücken.

## 6. Eigene Bildwelt

Verbindlich:
- `config/visual-policy.json`
- `channel/VISUAL_WORLD.md`

Erlaubt sind unter anderem:
- Handlungsszenen
- Objektbilder
- Karten
- Zeitleisten
- Prozesse
- Diagramme
- Zahlenvergleiche
- Infografiken
- Multi-Panels
- Querschnitte
- Text-/Zahlenbilder
- Szenen ohne Menschen

## 7. Phase 2 — Assets

Finale Bilder:
`00-bildprompts/images/Bild 01.png` bis `Bild NN.png`

Finales Voice-over: genau eine Audiodatei unter `02-audio/`.

Prüfung:

```bash
npm run validate:youtube-phase2 -- --dir "youtube/<week>/<slug>"
```

## 8. Phase 3 — Audio, Alignment, Timeline, Render und Export

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
12. YouTube-Metadaten-Datei erzeugen
13. SRT-Untertitel aus echten Whisper-Zeitstempeln erzeugen
14. lesbares Skript mit Zeitbereichen erzeugen
15. Post-Render-QC

## 9. Finaler Exportordner

```text
03-export/
├── FINAL_VIDEO.mp4
├── THUMBNAIL.png
├── YOUTUBE_UPLOAD.txt
├── SUBTITLES.srt
└── TIMED_SCRIPT.txt
```

- `FINAL_VIDEO.mp4`: fertiges Video
- `THUMBNAIL.png`: finales Bild 01
- `YOUTUBE_UPLOAD.txt`: Titel, Beschreibung, Tags
- `SUBTITLES.srt`: YouTube-Untertitel mit echten Zeitstempeln
- `TIMED_SCRIPT.txt`: lesbares Skript mit Zeitbereichen

## Definition of Done

Ein Video ist erst fertig, wenn:
- Thema geprüft ist
- Recherche/Skript/Bildplan fertig sind
- YouTube-Titel und Beschreibung fertig sind
- aktive Bildwelt `READY` ist
- genau 3 Cover-Kandidaten erzeugt wurden
- Google Flow selbst genau 1 Gewinner ausgewählt hat
- Gewinner als `Bild 01.png` übrig bleibt
- die 2 Cover-Verlierer gelöscht sind
- für Bild 02–NN keine Bildreferenz verwendet wurde
- Bild 02–NN in maximal 5er-Blöcken erzeugt wurden
- finale Bilder lückenlos benannt sind
- alle finalen Bilder in einem flachen Ordner liegen
- genau eine finale Stimme vorliegt
- Audio-QC bestanden ist
- echte Wortzeiten vorliegen
- Timeline keine Lücken/Überlappungen hat
- Pacing bestanden ist
- `FINAL_VIDEO.mp4` existiert
- `THUMBNAIL.png` existiert
- `YOUTUBE_UPLOAD.txt` existiert
- `SUBTITLES.srt` existiert
- `TIMED_SCRIPT.txt` existiert
- Post-Render-QC bestanden ist
