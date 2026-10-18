# Systemstatus — Alles Stickman

Stand: 18.10.2026 · Pipeline v8 · Bildwelt v15

## Produziert

| KW | Video | Länge | Status |
|---|---|---|---|
| 41 | Feuer, Kühlschrank, Heizung, Waschmaschine (Tests) | je ~2 min | gerendert |
| 41 | Wie bekamen Menschen früher Trinkwasser ohne Wasserhahn? | 5:55 | gerendert; „Geplanter Hold“ in 61 von 78 Bildern |
| 42 | Wie fanden Menschen ohne GPS ihren Weg? | 6:07 | gerendert; „Bild XX“ in 10 Bildern, ~9 Stilbrüche |

Bilder, Stimmen und MP4s liegen lokal, nicht auf GitHub (`.gitignore`). Die Reviews von Wasser und GPS sind abgeschlossen (18.10.2026); die vier Testvideos sind per `reviewExempt` von der Review-Sperre ausgenommen.

## Neu in v8

- **Skript:** Formel + `storyEngine` + Kennzahlen (Zahlen, „du“, Vorsichtswörter) als Phase-1-Gate.
- **Bilder:** Prompts generiert aus `SCENE_VISUALS_EN.json`, kurzer Stil- und Figurenblock, Hauptfigur mit rotem Schal, kein Text im Bild, Shot-Typen, Ø 3–5 s.
- **Prüfung:** OCR-Bildcheck blockiert den Render bei Produktionsinfo im Bild.
- **Video:** Text-Overlays (caption/card/label) und deutlich sichtbare Kamerafahrten in Remotion.
- **Audio:** Atempausen bleiben erhalten.
- **Thumbnail:** Headline wird beim Export gesetzt.
- **Fix:** `npm run create:youtube` lief unter Node 24 nicht.

## Offen

- Freigegebenes Figurenblatt für `channel/style-sheet/` (Hauptfigur festlegen).
- Echte lizenzfreie Hintergrundmusik statt Sinus-Generator.
- Erstes v8-Video produzieren und mit KW42 vergleichen.
- YouTube-Analytics (CTR, Bindung nach 30 s) in die Reviews eintragen.
