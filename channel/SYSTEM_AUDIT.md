# System-Audit — Alles Stickman

Stand: 2026-10-07

Dieses Dokument ersetzt den veralteten Ausgangs-Audit und beschreibt den aktuellen Stand des Repositories.

## Kurzurteil

**Die Pipeline ist für weitere Testvideos produktionsbereit.**

Die zentralen Pflichtblöcke für Planung, Bildwelt, Skript, Bildproduktion, Audio, Alignment, Render und YouTube-Export sind vorhanden und werden teilweise automatisiert geprüft. Noch offene Punkte betreffen hauptsächlich Qualitätssteigerung und Skalierung, nicht die grundsätzliche Fähigkeit, ein neues Testvideo zu produzieren.

## 1. Kanalstrategie — READY

Vorhanden:
- Kanalrichtung und Themenfelder
- Referenzanalyse
- eigene Alles-Stickman-Identität
- klare Themenabgrenzung
- YouTube-Titel-/Beschreibungssystem

Später sinnvoll:
- detaillierteres Zuschauerprofil
- Serien-/Playlist-Strategie
- Uploadfrequenz und Wachstumsziele

## 2. Themen-System — READY FÜR TESTS

Vorhanden:
- Topic Registry
- Duplicate-Check
- Projektreservierung
- Content-Säulen

Noch offen:
- stärkeres Topic-Scoring nach Klickpotenzial, Visualisierbarkeit, Quellenlage und Kanal-Fit
- semantischer Duplicate-Check

## 3. Recherche / Fakten — BASIS READY

Vorhanden:
- Recherchedatei pro Projekt
- Kernfrage
- Quellen/Faktenbasis
- Unsicherheiten und Vereinfachungen
- visuelle Fakten

Noch verbessern:
- Claim-zu-Quelle-Zuordnung
- härteres automatisches Fact-Check-Gate
- strengere Quellenstandards bei Wissenschaft/Geschichte

## 4. Skript-System — READY

Verbindlich:
- `config/script-policy.json`
- `channel/SCRIPT_SYSTEM.md`
- `99-technik/SCRIPT_PLAN.json` pro Video

Feste Struktur:

```text
Hook
→ Setup
→ Hauptteil
→ Auflösung
→ Schluss
```

Phase 1 prüft automatisch:
- alle fünf Abschnitte vorhanden
- exakte Startanker
- korrekte Reihenfolge
- Hook beginnt direkt am Anfang
- keine generische Begrüßung/Meta-Einleitung
- Wortdichte passend zur Zielzeit
- 32 Wörter pro Satz Hard-Max
- keine exakten langen Satzwiederholungen

Qualitativ zusätzlich festgelegt:
- natürliche deutsche Sprache
- keine KI-Floskeln
- keine Füllabsätze
- ungefähr alle 20–40 Sekunden neuer Informationsimpuls
- Auflösung beantwortet Hook-Frage
- möglichst jeder Absatz visualisierbar

## 5. Eigene Bildwelt — READY

Aktive Style-ID:
`alles-stickman-editorial-v1`

Vorhanden:
- Figurenlogik
- Linien
- Farben
- Hintergründe
- historische Plausibilität
- Karten
- Diagramme
- Infografiken
- Multi-Panels
- Text-/Zahlenbilder
- Objektbilder
- Szenen ohne Menschen
- Anti-AI-Slop-Regeln

## 6. Cover-System — READY

Verbindlich:
- genau 3 Cover-Kandidaten
- danach HARD STOP
- Nutzer wählt A, B oder C
- vor der Nutzerwahl kein Bild 02
- Auswahl = `Bild 01.png`
- Bild 01 = Thumbnail + erste Videoszene
- beide Verlierer erst nach Nutzerwahl löschen

## 7. Bildgenerierung — READY ALS AGENT-WORKFLOW

Verbindlich:
- Bild 02–NN in echten 5er-Schritten
- pro Agenten-Schritt genau ein 5er-Block
- nach jedem Block HARD STOP
- nächster Block nur nach ausdrücklichem `WEITER`
- jedes Nicht-Cover-Bild nur einmal, außer technischem Fehlschlag
- `referenceMode: none`
- keine generierten Bilder als Referenzvorlage
- Konsistenz ausschließlich über Visual Policy + individuellen Vollprompt
- finaler Bilderordner flach und ohne Zusatzdateien

Noch offen:
- direkter automatischer Google-Flow-Aufruf aus Node
- automatische visuelle Qualitätsbewertung nach Generierung

## 8. Voice / Audio — TECHNISCHE PIPELINE READY

Vorhanden:
- genau eine finale Voice-Datei
- Original bleibt unverändert
- Pausenkürzung
- 1,10× Playback
- −16 LUFS
- −1,5 dBTP
- 48 kHz

Noch offen:
- festes automatisiertes TTS-/Voice-Erzeugungssystem
- kanalweite feste Stimme/Aussprachebibliothek

## 9. Alignment / Timeline / Pacing — READY

Vorhanden:
- Whisper-Wortzeiten
- Audio-Anker
- automatische Zuordnung
- lückenlose Timeline
- Pacing-QC
- Schluss-Hold

## 10. Motion / Editing — BASIS READY

Vorhanden:
- Remotion
- Zoom/Pan
- SFX-Unterstützung

Noch verbessern:
- Karten-/Diagramm-Animationen
- Fokusbewegungen
- Layer/Parallax
- variablere Übergänge
- stärkere inhaltsabhängige Motion

## 11. Render / Export — READY

Vorhanden:
- 1920×1080
- 30 FPS
- H.264
- finale MP4
- Thumbnail
- YouTube-Titel/Beschreibung/Tags
- SRT-Untertitel
- Zeitstempel-Skript

Finaler Export:

```text
03-export/
├── FINAL_VIDEO.mp4
├── THUMBNAIL.png
├── YOUTUBE_UPLOAD.txt
├── SUBTITLES.srt
└── TIMED_SCRIPT.txt
```

## 12. Final-QC — BASIS READY

Vorhanden:
- Pflichtdateien
- Pacing
- Timeline
- Exportdateien
- grundlegende Renderprüfung

Noch verbessern:
- Black-/Missing-Frame-Erkennung
- Loudness nach finalem MP4 erneut messen
- Auflösung/FPS/Dauer als härtere Export-Gates
- vollständiger End-to-End-Smoke-Test

## 13. Analytics — NOCH OFFEN

Für echte Kanaloptimierung später ergänzen:
- CTR
- Impressions
- Watchtime
- Retention/Drop-Offs
- Views nach 24 h / 7 d / 30 d
- Titel-/Thumbnail-Wechsel
- Learnings zurück in Themen-, Skript- und Bildregeln

## Aktuelle Zielarchitektur

```text
Thema
→ Duplicate-/später Topic-Scoring
→ Recherche
→ Skript-System + SCRIPT_PLAN
→ Bildplanung
→ 3 Cover → STOP → Nutzer wählt A/B/C
→ 5er-Block → STOP/WEITER → nächster 5er-Block ohne Referenzbild
→ Voice
→ Audio-QC
→ Whisper/Alignment
→ Timeline/Pacing
→ Remotion
→ Render
→ Export-QC
→ YouTube-Paket
→ später Analytics-Feedbackloop
```

## Fazit

Für **weitere kurze Testvideos** gibt es aktuell keinen Pflichtblocker.

Die drei größten nächsten Qualitätshebel sind:

1. stärkeres Research-/Fact-Check-Gate
2. bessere Motion-/Editing-Logik
3. festes TTS-/Voice-System

Diese Punkte können iterativ nach weiteren Testvideos verbessert werden.
