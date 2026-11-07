# Produktionsplan – Shorts / Reel

## Ziel

- Format: Shorts / Reel (9:16 vertikal, 1080 × 1920)
- Ziel-Länge: 60–90 Sekunden Audio (mindestens 1 Minute, höchstens 1,5 Minuten)
- Bilddichte: Extrem hoch (viel mehr Bilder als bei Longform). Schnittfrequenz Ø 1,5–2,8s pro Bild (ca. 30–50 Bilder pro Short). Kein Bild steht lange still.
- Thema: [THEMA]
- Sprache: Deutsch
- Stimme: stickman-user-clone (0.95x Tempo, max. 0,30s Pause)

## Upload-Metadaten

Die finalen Upload-Metadaten werden in `99-technik/video.json` unter `uploadMetadata` gepflegt und beim Export automatisch in `03-export/YOUTUBE_UPLOAD.txt` geschrieben.

- YouTube-Shorts-Titel: [TITEL] #shorts
- Beschreibung: [BESCHREIBUNG]
- Tags: [TAGS]

## Phase 1 (Agent – Skript, Prompts & fertige Stimme)

- Recherche abgeschlossen: [ ]
- Skript abgeschlossen (60–90s Audio, ca. 150–220 Wörter): [ ]
- SCRIPT_PLAN abgeschlossen: [ ]
- Skript-Gate bestanden: [ ]
- Stimme autonom generiert (`npm run voice:youtube` -> `02-audio/voice.wav`): [ ]
- Bildprompts erzeugt (`npm run prompts:youtube`): [ ]
- Phase-1-Validierung bestanden: [ ]

## Phase 2 (Nutzer – Reine Bildgenerierung via Google Flow)

- Google Flow arbeitet One-Paste Master ab: [ ]
- 3 vertikale Cover erzeugt (TEMP_COVER_A/B/C): [ ]
- HARD STOP nach den 3 Cover-Kandidaten: [ ]
- Nutzerwahl A/B/C erhalten: [ ]
- Gewählte Variante als Cover gespeichert, Verlierer gelöscht: [ ]
- Erster 5er-Block (Bild 01–05) erzeugt: [ ]
- Weitere 5er-Blöcke automatisch ohne Rückfrage erzeugt: [ ]
- Bilder nummeriert als Bild 01.png bis Bild NN.png: [ ]
- Finaler Soll-Ist-Bildercheck durchgeführt: [ ]
- Alle Bilder flach und lückenlos in `00-bildprompts/images/`: [ ]
- Keine Audio-Aufnahmen oder Audio-Arbeit durch den Nutzer: [ ]

## Phase 3 (Agent – Schnitt, Render & Export)

- Audio optimiert (`02-audio/voice.wav` -> `99-technik/YOUTUBE_AUDIO_OPTIMIZED.wav`): [ ]
- Alignment bestanden (`auto-align`): [ ]
- Timeline bestanden (`build:youtube-timeline`): [ ]
- Pacing bestanden (60–90s Gesamtdauer): [ ]
- Render bestanden (1080 × 1920 vertikal): [ ]
- Export-QC bestanden: [ ]

## Finaler Exportordner (`03-export/`)

- `FINAL_VIDEO.mp4` — fertiges 9:16 Video
- `YOUTUBE_UPLOAD.txt` — Upload-Titel, Beschreibung, Hashtags (#shorts)
- `SUBTITLES.srt` — synchrone Untertitel
- `TIMED_SCRIPT.txt` — getaktetes Skript
