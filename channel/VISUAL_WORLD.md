# Bildwelt v15 — Alles Stickman

Gilt ab Pipeline v8. Projekte bis v7 nutzen weiter [MASTER_VISUAL_STYLE_EN.txt](MASTER_VISUAL_STYLE_EN.txt) (v14, Archiv).

## Was gleich bleibt

Handgezeichnete 2D-Editorial-Cartoons: dunkle, leicht unregelmäßige Tuschekonturen, flache Farben, sparsame Schatten, Farben passend zur Szene. Dieser Stil hat im GPS-Video gut funktioniert und bleibt das Erkennungsmerkmal.

## Was neu ist und warum

| Regel | Grund (echte Fehler) |
|---|---|
| **Prompts werden generiert** (`npm run prompts:youtube`) aus `SCENE_VISUALS_EN.json`. Nie von Hand. | „Geplanter Hold 4.57s“ in 61 von 78 Wasser-Bildern, „Bild 05“ in 10 GPS-Bildern: Metazeilen im Prompt wurden mitgezeichnet. |
| **Prompts kurz:** Stil (~70 Wörter) + Figuren (~70) + Szene. Statt 1.100 Wörter mit Verboten und fremden Themen. | Die Szene ging im Stiltext unter; erwähnte Themen (Aquädukt, Stromkreis) wandern ins Bild. |
| **Jeder Mensch ist dieselbe Strichfigur**, in jeder Kultur und Epoche, auch die Hände. | GPS: Polynesier (Bild 60–65), Seeleute (31, 51) und Hände (29, 45, 58) wurden halb-realistisch. |
| **Wiederkehrende Hauptfigur** mit rotem Schal (`protagonist: true`), Ziel ≥ 25 % der Szenen. | Erfolgskanäle haben eine feste Figur. Bei uns war jedes Mal ein anderer „Reisender“ zu sehen. |
| **Null Text im KI-Bild.** Zahlen, Begriffe, Jahreszahlen → `overlay` in `BILD_AUDIO_ZUORDNUNG.json` (Remotion). | Englische Labels, „O/E“, Anführungszeichen, „Polaris“ statt Polarstern, Pseudotext. |
| **Kameraeinstellung pro Szene** (`shot`), ≥ 15 % Close-ups. | Ink Explainer erzählt Emotion über Nahaufnahmen. |
| **Ø 3–5 s pro Bild** statt 4,5–7,5 s. | Ink Explainer: alle 2,5 s ein Schnitt; wir: 4,8 s. |
| **Cover ohne Text**, großes Gesicht mit Emotion, oberes Drittel frei. Headline setzt der Export (`thumbnailText`). | KI-Schrift ist unzuverlässig; das Gewinner-Format ist Gelb mit schwarzer Kontur. |

## Dateien

- [STYLE_BLOCK_EN.txt](STYLE_BLOCK_EN.txt) – der Stil, in jedem Prompt
- [CHARACTER_BIBLE_EN.txt](CHARACTER_BIBLE_EN.txt) – Strichfiguren-Konstruktion, in jedem Prompt
- `config/visual-policy.json` – Hauptfigur, Shot-Typen, Cover, Textregel
- `style-sheet/` – optional freigegebene Figuren-/Stilbilder als feste Referenz ([Anleitung](style-sheet/README.md))

## Szenenplan schreiben (`99-technik/SCENE_VISUALS_EN.json`)

```json
{ "sceneNumber": 7, "shot": "close-up", "protagonist": true,
  "brief": "The red-scarf stick figure grips a wet ship rail at night, eyes wide, while black rocks appear through spray right in front of the bow." }
```

Gute briefs zeigen **eine Handlung mit Emotion und einem Objekt**. Keine Dateinamen, Zeiten, Versionen, Labels oder Anweisungen an Menschen.

## Prüfung

1. Phase 1: Szenenplan vollständig, keine Produktionsinfo, Prompts aktuell (Abgleich mit Generator).
2. Nach jedem Flow-Block: Strichfiguren? kein Text? Epoche richtig? auf dem Handy in 2 s lesbar?
3. Vor dem Render: `npm run check:youtube-images` (OCR) blockiert Bilder mit Produktionsinfo.
4. Nach dem Render: echte Sichtprüfung im `POST_VIDEO_REVIEW.json`. Ein bestandener Test ersetzt keinen Blick ins Video.
