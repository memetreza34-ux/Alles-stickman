# YouTube Workflow

Dieses Repository enthält nur die **allgemeine Produktionspipeline**. Thema, Nische und Bildwelt sind bewusst nicht vorgegeben.

## Grundprinzip

```text
Thema
→ Recherche / Skript
→ Bildplanung
→ Bildgenerierung
→ finale Voice-over-Datei
→ Audio-Optimierung
→ Wort-/Anchor-Alignment
→ Timeline
→ Pacing-QC
→ Remotion-Render
→ Export-QC
```

## 0. Einmalige Einrichtung

1. `config/visual-policy.json` mit der **neuen** Bildwelt füllen.
2. `status` auf `READY` setzen.
3. Eine eindeutige `styleId` vergeben.
4. `npm install` ausführen.
5. Lokal verfügbar machen:
   - Node.js >= 24
   - FFmpeg / FFprobe
   - Whisper CLI (`whisper`)

## 1. Thema prüfen

```bash
npm run topic:youtube -- --topic "THEMA"
```

Der Check verwendet ausschließlich die **neue leere Registry dieses Repositories** und später hier erzeugte Projekte. Keine Themenhistorie aus anderen Repositories wurde übernommen.

## 2. Projekt anlegen

```bash
npm run create:youtube -- \
  --topic "THEMA" \
  --title "TITEL" \
  --week "YYYY-KWNN_DD-MM_bis_DD-MM" \
  --slug "themen-slug"
```

Ergebnis:

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
    ├── YOUTUBE_RENDER_PLAN.json
    └── status.json
```

## 3. Phase 1

Phase 1 erstellt bzw. füllt:

- Recherche
- Voice-over-Skript
- Bildplan
- vollständige Bildprompts
- Audio-Anker pro Bild
- Render-/SFX-Plan
- Metadaten

### Allgemeine Bildplan-Regeln

- keine starre Bildzahl
- 1 Bild = 1 klare visuelle Funktion
- dichte Passagen früher splitten
- durchschnittlich ca. 4,5–7,5 s pro Bild
- ab 9 s Split prüfen
- ab 11 s Split stark bevorzugen
- 16 s Hard-Max
- keine Füllbilder
- Bild 01 = Cover + erste Videoszene
- Bild 01 wird 3× als Cover-Kandidat erzeugt; genau 1 Gewinner bleibt
- Bild 02–NN jeweils nur 1×

### Bildwelt

Die Pipeline schreibt **keine Figurenart und keinen Zeichenstil vor**. Das wird allein in `config/visual-policy.json` definiert.

Jeder Bildmoment sollte mindestens enthalten:

```text
Visual Purpose: ...
Topic Anchor: ...
Visual Form: ...
Prompt: ...
```

Vor Asset-Erzeugung:

```bash
npm run validate:youtube-phase1 -- --dir "youtube/<week>/<slug>"
```

## 4. Phase 2 — Assets

Finale Bilder:

```text
00-bildprompts/images/Bild 01.png
...
00-bildprompts/images/Bild NN.png
```

Finales Nutzer-Voice-over: genau **eine** Audiodatei unter:

```text
02-audio/
```

Das Nutzeroriginal wird nie überschrieben.

Prüfung:

```bash
npm run validate:youtube-phase2 -- --dir "youtube/<week>/<slug>"
```

## 5. Phase 3

```bash
npm run phase3:youtube -- --dir "youtube/<week>/<slug>"
```

Reihenfolge:

1. Preflight
2. Phase-1-Gate
3. Phase-2-Gate
4. Audio intern optimieren
5. Whisper auf dem optimierten Audio
6. Bildanker ausrichten
7. finale Timeline bauen
8. Pacing prüfen
9. Pre-Render-QC
10. Remotion rendern
11. Thumbnail aus Bild 01 kopieren
12. Post-Render-QC

Nur vorbereiten, ohne Render:

```bash
npm run phase3:youtube -- --dir "youtube/<week>/<slug>" --prepare-only
```

## Audio-Standard

Standardwerte stehen in `config/pipeline.json`:

- 1,10× bei erhaltener Tonhöhe
- lange Pausen kürzen
- Endstille entfernen
- Ziel −16 LUFS
- True Peak max. −1,5 dBTP
- 48 kHz
- Nutzeroriginal unverändert

## Schluss-Hold

Nach dem letzten gesprochenen Wort bleibt das letzte Bild standardmäßig **1,3 s** sichtbar. Zulässig sind 1,2–1,5 s.

## Definition of Done

Ein Video ist fertig, wenn:

- Thema nicht doppelt ist
- Bildwelt für dieses Repo definiert ist
- Phase 1 bestanden ist
- Bildanzahl inhaltsgetrieben ist
- Bild 01 Cover + erste Szene ist
- finale Bilder sauber benannt sind
- genau eine Nutzerstimme vorliegt
- Audio-QC bestanden ist
- echte Wortzeiten für die Bildanker vorliegen
- Timeline keine Lücken oder Überlappungen enthält
- Pacing-Gate bestanden ist
- Render existiert
- Thumbnail byte-identisch aus Bild 01 stammt
- Post-Render-QC bestanden ist
