# Produktionsplan – Shorts / Reel

## Ziel

- Format: Shorts / Reel (9:16 vertikal, 1080 × 1920)
- Ziel-Länge: 60–90 Sekunden Audio (mindestens 1 Minute, höchstens 1,5 Minuten)
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

## Phase 2 (Nutzer – Reine Bildgenerierung)

- Bilder im Format 9:16 vertikal erstellen
- Keine Audio-Aufnahmen oder Audio-Arbeit durch den Nutzer
- Bilder in `00-bildprompts/images/Bild 01.png` etc. ablegen
- Finale Bildanzahl lückenlos

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
