# System-Audit — Alles Stickman

Stand: 2026-10-05

Ziel: Prüfen, ob das Repository bereits das vollständige System für einen deutschsprachigen faceless Stickman-Erklärkanal über Menschheit, Evolution, Geschichte, Alltag, Erfindungen und ungewöhnliche Fragen enthält.

## Kurzurteil

Die technische Produktionspipeline ist vollständig als Basis übernommen und CI läuft erfolgreich. Das Repository ist jedoch noch **nicht das komplette kanalspezifische System**. Vor dem ersten echten Video müssen insbesondere Bildwelt, Thumbnail-System, Research-/Fact-Check, Skriptregeln, Asset-Erzeugung, Motion-System, Upload-Paket und Analytics-Feedbackloop fertig definiert bzw. umgesetzt werden.

## 1. Kanalstrategie

Status: TEILWEISE VORHANDEN

Vorhanden:
- `channel/CHANNEL_DIRECTION.md`
- Kernidee und Kanalversprechen
- fünf Content-Säulen
- Themen, die nicht zum Kanal gehören
- Startformat 8–12 Minuten
- Titelgrundformen

Fehlt noch:
- genaue Zielgruppe / Zuschauerprofil
- Wissensniveau und Tonalität
- feste Hook-/Story-Regeln
- Serienlogik und Playlist-System
- Uploadfrequenz und Produktionsziel
- klare Kriterien, wann ein Thema stark genug ist

## 2. Referenzkanäle / Konkurrenzverständnis

Status: VORHANDEN

Vorhanden:
- `channel/REFERENCE_ANALYSIS.md`
- gemeinsame Themenmuster der Referenzkanäle
- Thumbnail-Muster
- Bildwelt-Muster
- Gründe, warum das Format funktioniert
- Risiken der Nische
- Regel: Formatprinzip übernehmen, keine konkrete Gestaltung kopieren

Noch sinnvoll:
- Referenzdaten später um reale Performance-Daten erweitern
- neue Kanäle/Trends regelmäßig ergänzen

## 3. Themen-System

Status: TECHNISCH VORHANDEN, STRATEGISCH NOCH UNVOLLSTÄNDIG

Vorhanden:
- `config/topic-registry.json`
- Duplicate-Check
- Projektreservierung
- fünf Content-Säulen in der Kanalrichtung

Fehlt noch:
- Topic-Scoring für Klickpotenzial, Neugier, Visualisierbarkeit, Quellenlage und Kanal-Fit
- semantischer Duplicate-Check statt nur starker Textähnlichkeit
- Ideen-Backlog / Prioritäten
- Serien- und Clusterplanung

## 4. Recherche / Fakten

Status: NUR GRUNDGERÜST

Vorhanden:
- `RECHERCHE.md`
- Kernfrage
- Faktenbasis
- Vereinfachungen / Unsicherheiten
- visuelle Fakten

Fehlt noch:
- verpflichtende Quellenstandards
- Claim-zu-Quelle-Zuordnung
- Primär-/Sekundärquellen-Regeln
- Unsicherheitskennzeichnung
- Fakten-QC als echtes Gate
- Regeln für historische Rekonstruktionen, Evolution, Biologie und strittige Behauptungen

## 5. Skript-System

Status: NUR DATEISTRUKTUR / PHASE-GATE

Vorhanden:
- `01-voice-script/voice-script.txt`
- Prüfung, dass kein Platzhalter übrig bleibt
- Audio-Anker für Bilder

Fehlt noch:
- kanaltypische Skriptstruktur
- Hook-Regel für die ersten Sekunden
- Story-/Kapitelbogen
- Satzlänge und Sprachstil
- Informationsdichte
- Neugier-Loops / Übergänge
- Schlussregel / CTA
- Regeln gegen monotone KI-Sprache

## 6. Eigene Stickman-Bildwelt

Status: BLOCKIERT / NOCH NICHT DEFINIERT

`config/visual-policy.json` steht bewusst auf `UNSET`.

Noch festzulegen:
- Figurenproportionen
- Kopf-/Gesichtslogik
- Augen, Mund, Haare, Bärte
- Linienbreite und Strichtextur
- Farbpalette
- Kleidung nach Epoche
- Hintergrunddetail
- historische Requisiten
- Kartenstil
- Diagramm-/Infografikstil
- Text im Bild
- Kompositionsregeln
- verbotene AI-Slop-Muster
- Style-QC und Referenzbilder

Wichtig: Erst nach Auswahl unserer eigenen Bildwelt auf `READY` setzen.

## 7. Bildplanung

Status: STARK VORHANDEN

Vorhanden:
- keine feste Bildzahl
- 1 Bild = 1 klare visuelle Funktion
- Visual Purpose
- Topic Anchor
- Visual Form
- Audio Anchor
- Planned Hold
- durchschnittliches Pacing
- Hard-Max pro Bild
- keine Füllbilder

Diese Basis passt gut zum geplanten Kanal.

## 8. Bildgenerierung

Status: REGELN VORHANDEN, AUTOMATION FEHLT

Vorhanden:
- Google-Flow-Masterprompt
- Benennung `Bild 01.png` bis `Bild NN.png`
- Generation-Regeln
- flacher finaler Bilderordner

Fehlt noch:
- echter automatisierter Aufruf von Google Flow / Bildmodell
- Retry-Logik bei schlechtem Bild
- automatische Qualitätsprüfung
- Konsistenzprüfung gegen die aktive Bildwelt
- kontrollierte Referenzbild-Nutzung
- Fehlerbehandlung bei Text-/Anatomie-/Stilfehlern

## 9. Thumbnail-System

Status: AKTUELLE REGEL PASST NOCH NICHT OPTIMAL ZUM KANAL

Aktuell gilt:
- Bild 01 = erste Videoszene = Thumbnail
- drei Cover-Kandidaten
- separates Thumbnail verboten

Problem:
Die analysierten Referenzkanäle arbeiten stark mit thumbnail-spezifischer Komposition, sehr großer Frage/Headline und stärkerem Klickfokus. Eine gute erste Videoszene und ein optimales Thumbnail müssen nicht identisch sein.

Vor dem Start entscheiden:
- aktuelle Regel behalten ODER
- eigenes Thumbnail-System mit 3 Kandidaten und eigener Komposition einführen
- Schrift, Textmenge, Kontrast, Figurenanzahl und Hauptobjekt verbindlich festlegen

## 10. Voice / Audio

Status: TECHNISCHE NACHBEARBEITUNG STARK, VOICE-ERZEUGUNG FEHLT

Vorhanden:
- genau eine finale Voice-Datei
- Original bleibt unverändert
- 1,10× Playback
- Pausenverkürzung
- Loudness-Ziel
- True-Peak-Ziel
- 48 kHz

Fehlt noch:
- festgelegte Kanalstimme
- TTS-/Voice-Workflow
- Aussprache-Regeln
- Voice-QC vor Phase 3

## 11. Audio-Alignment

Status: VORHANDEN

Vorhanden:
- Whisper
- Wort-Timestamps
- exakte Bildanker
- Alignment-Evidence
- Fehler bei nicht gefundenen Ankern

## 12. Timeline / Pacing

Status: VORHANDEN

Vorhanden:
- automatisch aus echten Wortzeiten
- lückenlose Bild-Timeline
- Schluss-Hold
- Pacing-QC

Verbesserung:
- einige Warnungen sollten für diesen Kanal später zu härteren Gates werden
- tatsächliche Holds gegen geplante Holds vergleichen

## 13. Motion / Editing

Status: BASIS VORHANDEN, FÜR DAS ZIELFORMAT NOCH ZU EINFACH

Vorhanden:
- Remotion
- Zoom/Pan
- SFX-Unterstützung

Fehlt noch:
- inhaltsabhängige Fokusbewegungen
- Übergänge
- harte Cuts nach Bedarf
- Kartenanimationen
- Diagramm-/Prozessanimationen
- Text-/Label-Animationen
- Layer-/Parallax-Möglichkeiten
- visuelle Kapitelwechsel
- Motion-Overrides wirklich in der Timeline nutzen

## 14. Sounddesign / Musik

Status: TEILWEISE

Vorhanden:
- SFX-Plan und SFX-Wiedergabe

Aktuell:
- Hintergrundmusik standardmäßig aus

Fehlt noch:
- Sounddesign-Regeln
- SFX-Bibliothek/Benennung
- Lautstärke-QC
- Entscheidung, ob und wann Musik eingesetzt wird

## 15. Render

Status: VORHANDEN

Vorhanden:
- Remotion
- 1920×1080
- 30 FPS
- H.264
- CRF 18
- finale MP4

## 16. Final-QC

Status: TEILWEISE

Vorhanden:
- Video existiert
- Mindestdateigröße
- Thumbnail existiert
- aktueller Thumbnail/Cover-Hash-Check

Fehlt noch:
- Auflösung/FPS prüfen
- finale Mediendauer prüfen
- Audio im MP4 prüfen
- Loudness nach Export prüfen
- Black-/Missing-Frame-Checks
- SFX-Peaks prüfen
- vollständiger End-to-End-Render-Test

## 17. YouTube-Upload-Paket

Status: UNVOLLSTÄNDIG

Vorhanden:
- Titel/Beschreibung/Tags als Felder im Produktionsplan
- Chapters-JSON als Template
- Video + Thumbnail Export

Fehlt noch:
- finale `DESCRIPTION.txt`
- finale `CHAPTERS.txt`
- `SUBTITLES.srt`
- `TRANSCRIPT.txt`
- Upload-Metadaten als fertiges Paket
- optional automatisierter Upload / Upload-Check

## 18. Analytics / Lernschleife

Status: FEHLT

Benötigt:
- CTR
- Impressions
- durchschnittliche Wiedergabedauer
- Zuschauerbindung / Drop-Offs
- Views nach 24 h / 7 d / 30 d
- Thumbnail- und Titelwechsel dokumentieren
- Gewinner-Themen erkennen
- Learnings zurück in Topic-, Skript-, Thumbnail- und Pacing-Regeln schreiben

Ohne diesen Feedbackloop ist es eine Produktionspipeline, aber noch kein vollständiges Kanal-Wachstumssystem.

## 19. Tests / CI

Status: VORHANDEN, ABER TESTABDECKUNG NOCH NICHT VOLLSTÄNDIG

Vorhanden:
- GitHub Actions Node CI
- Unit-/Policy-Tests
- aktueller Main-Stand läuft grün

Fehlt noch:
- kompletter Testprojekt-Durchlauf
- Phase-1/2/3-Integrationstest
- Render-Smoke-Test
- End-to-End-Test mit Testassets

## 20. Gesamtstatus

### Bereits vorhanden
- Kanalgrundrichtung
- Referenzanalyse
- allgemeine Produktionspipeline
- Projektstruktur
- Themen-Duplicate-Check
- Bildplanung
- Audio-Optimierung
- Whisper-Alignment
- Timeline
- Pacing
- Remotion-Render
- Export-QC-Basis
- CI

### Vor dem ersten echten Video zwingend fertigstellen
1. eigene Stickman-Bildwelt
2. Thumbnail-Entscheidung und Thumbnail-Regeln
3. Research-/Fact-Check-Standard
4. kanaltypisches Skript-System
5. Kanalstimme / Voice-Workflow
6. Bildgenerierungs-Workflow mit Qualitätskontrolle
7. Motion-/Editing-Regeln
8. Final-QC erweitern
9. Upload-Paket definieren

### Danach für Wachstum ergänzen
10. Topic-Scoring
11. Analytics-/Feedbackloop
12. vollständige Integrationstests

## Zielarchitektur

```text
Kanalstrategie
→ Ideenpool / Topic-Scoring
→ Duplicate-Check
→ Recherche + Quellen-QC
→ Skript
→ Bild-/Thumbnail-Plan
→ Stickman-Asset-Erzeugung + Style-QC
→ Voice
→ Audio-QC
→ Alignment
→ Timeline
→ Motion + SFX
→ Render
→ Final-QC
→ Upload-Paket
→ YouTube
→ Analytics
→ Learnings zurück in Themen/Skript/Thumbnail/Pacing
```

Erst wenn diese Kette ohne offene Pflichtblöcke funktioniert, gilt Alles Stickman als vollständiges Kanal-System und nicht nur als Video-Produktionspipeline.
