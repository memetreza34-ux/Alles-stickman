# Produktionsplan — Erstes 6–7-Minuten-Longform-Video

## Thema und Format
- Titel: **Wie bekamen Menschen früher Trinkwasser ohne Wasserhahn?**
- Format: 16:9, 1920×1080, 30fps, keine Hintergrundmusik
- Dauerziel: **400 Sekunden / 6:40 Min.**; erlaubt **365–420 Sekunden**
- Sprechertext: **1.048 Wörter**
- Bilder: **78 inhaltsgetriebene Szenen**
- Kapitel: **15 dramaturgische Abschnitte**, nicht 15 eingeblendete Titel
- Tempo: klare neue Erkenntnis alle etwa 25–45 Sekunden, keine Wiederholung/aufgeblasene Länge

## Phase 1 — Redaktion
- [x] Thema und Titel
- [x] Recherche und Grenzen der Behauptungen
- [x] Hook mit Problem und sofort erkennbarer Frage
- [x] 1.048-Wörter-Skript
- [x] SCRIPT_PLAN mit Hook, Setup, Hauptteil, Antwort und Schluss
- [x] 15 Mikro-Kapitel und Retention-Anker
- [x] 78 nummerierte Szenen/Audiosätze
- [x] Ort-/Klimakontinuitätsprofil
- [x] Google-Flow-Masterprompt
- [x] 16 konkrete Bild-Batchdateien
- [x] Uploadtitel/Beschreibung/Tags
- [x] Node Phase-1-Validator + GitHub Actions geprüft: SUCCESS

## Phase 2 — Bilder und Ton
- [ ] genau 3 Cover-Kandidaten A/B/C
- [ ] **HARD STOP; Nutzer wählt A/B/C**
- [ ] Sieger = Bild 01, beide Verlierer löschen
- [ ] danach Bild 02–06, 07–11, ... 77–78 automatisch
- [ ] Nach jedem Block stille QC und zielgerichtete Reparatur
- [ ] Alle 78 Bilder in einem flachen images-Ordner, nummeriert, nachprüfen
- [ ] Finale deutsche Sprechdatei in 02-audio/

## Phase 3 — Schnitt und Export
- [ ] Voice-Optimierung und Whisper-Alignment
- [ ] reale Voice-/Gesamtdauer 365–420 Sekunden
- [ ] 78 Bilder sinnvoll im Ton verankert; keine erzwungene Standzeit
- [ ] Kapitelmarker aus finaler Timeline ableiten
- [ ] Remotion mit ruhigen dynamischen Zooms/Pans und passenden SFX rendern
- [ ] fünf Exportdateien inklusive MP4, Thumbnail, Caption, SRT und Timed Script
- [ ] Pre-/Post-Render-QC

## Qualitätsschwerpunkte
**Bilder:** lebendige historische Welten, flexible Figuren, keine sterilen Standard-Infografiken, verständliche Querschnitte; Kulturwechsel nur mit Sprecheranker.  
**Skript:** knapper Hook, natürliche Sprache, regelmäßige Neugierimpulse, keine beleglosen Zahlen.  
**Technik:** kein Render, solange echte Dauer/Assets nicht passen.

**Wichtig:** Google Flow und TTS werden durch das Node-Repo nicht direkt ausgelöst. Phase 1 bereitet ausführbare Agenten-Prompts vor; das finale MP4 entsteht erst nach realen Bild- und Audiodateien.
