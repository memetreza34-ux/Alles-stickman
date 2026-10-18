# Google Flow — Bildproduktion (Pipeline v8)

Der genaue Ablauf steht in jedem Projekt in `00-bildprompts/google-flow-prompt.txt` (generiert). Kurzform:

```text
Figurenblatt anhängen (fehlt es: selbst erzeugen + prüfen) → 3 Cover → STOPP → Nutzer wählt A/B/C → Bild 01
→ batches/BLOCK_02_06 → BLOCK_07_11 → … automatisch, ohne Rückfrage
→ nach jedem Block: nur durchgefallene Bilder neu
→ alle Bilder flach in 00-bildprompts/images/ → npm run check:youtube-images
```

## Regeln

- Pro Bild **nur den Text zwischen `▼▼▼ PROMPT START ▼▼▼` und `▲▲▲ PROMPT ENDE ▲▲▲`** einfügen. Dateiname, Nummern und Zeiten gehören nie in den Prompt.
- Referenz: nur `channel/style-sheet/hauptfigur.png`. Cover und vorherige Szenen nie.
- Bild durchgefallen, wenn: ein Mensch nicht als Strichfigur gezeichnet ist (auch Hände), Text/Zahlen/Wasserzeichen im Bild, falsche Epoche oder modernes Objekt, Hauptmotiv auf dem Handy nicht in 2 s erkennbar.
- Fertig ist der Ordner, wenn `Bild 01.png` bis `Bild NN.png` lückenlos da sind, keine Zusatzdateien und der Textcheck ohne Fehler durchläuft.
