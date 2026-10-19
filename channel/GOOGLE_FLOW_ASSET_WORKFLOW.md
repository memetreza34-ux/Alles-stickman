# Google Flow — Bildproduktion (Pipeline v8)

`00-bildprompts/google-flow-prompt.txt` ist ein generierter, vollständiger Gesamtprompt. Seinen gesamten Inhalt einmal in Google Flow einfügen. Stil, Figurenregeln, Figurenblatt-Prompt, Cover, historischer Kontext und alle Szenen stehen direkt darin. Flow braucht keinen Repo-Zugriff, weitere Dateien, Skripts oder Uploads. Kurzform:

```text
Figurenblatt aus eingebettetem Prompt erzeugen + prüfen → 3 Cover → STOPP → Nutzer wählt A/B/C → Bild 01
→ eingebettete Szenen 02–06 → 07–11 → … automatisch, ohne Rückfrage
→ nach jedem Block: nur durchgefallene Bilder neu
→ ZIP oder reale Einzelbild-Downloads → lokal flach in 00-bildprompts/images/ → npm run check:youtube-images
```

## Regeln

- Der Nutzer kopiert den Gesamtprompt einmal. Flow baut daraus jede einzelne Bildanfrage: Stil + Figurenregel + gegebenenfalls Hauptfigur + Szene + Kamera + gegebenenfalls Farben + Textverbot. Bei den eingebetteten Cover- und Figurenblatt-Anfragen nutzt Flow den Text zwischen den Markierungen. Dateinamen, Verwaltungszeilen und Nummern werden nie ans Bildmodell geschickt.
- Referenz: nur das in der Sitzung vorhandene oder selbst erzeugte Figurenblatt `hauptfigur.png`, soweit unterstützt. Cover und vorherige Szenen nie. Die Einzel- und Batch-Dateien im Repository sind optionale Werkzeuge, keine Voraussetzung.
- Gewähltes Cover bleibt Bild 01 und Quelle für das spätere Thumbnail; Figurenblatt und nicht gewählte Cover gehören nicht ins finale ZIP. Nur reale Downloads anbieten; bei Grenzen den exakten Fortsetzungspunkt melden.
- Bild durchgefallen, wenn: ein Mensch nicht als Strichfigur gezeichnet ist (auch Hände), Text/Zahlen/Wasserzeichen im Bild, falsche Epoche oder modernes Objekt, Hauptmotiv auf dem Handy nicht in 2 s erkennbar.
- Fertig ist der Ordner, wenn `Bild 01.png` bis `Bild NN.png` lückenlos da sind, keine Zusatzdateien und der Textcheck ohne Fehler durchläuft.
