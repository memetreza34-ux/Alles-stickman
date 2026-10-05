# Alles Stickman

Produktionsrepository für einen deutschsprachigen faceless YouTube-Erklärkanal über Menschheit, Evolution, Geschichte, Alltag, Erfindungen, Ressourcen und ungewöhnliche Fragen.

## Kernsystem

- eigene Stickman-Bildwelt: `config/visual-policy.json`
- Kanalrichtung: `channel/CHANNEL_DIRECTION.md`
- Referenzanalyse: `channel/REFERENCE_ANALYSIS.md`
- Bildwelt-Dokumentation: `channel/VISUAL_WORLD.md`
- Google-Flow-Ablauf: `channel/GOOGLE_FLOW_ASSET_WORKFLOW.md`
- aktueller Systemstatus: `channel/SYSTEM_STATUS.md`
- früherer Ausgangs-Audit: `channel/SYSTEM_AUDIT.md`
- komplette Produktionsanleitung: `youtube/WORKFLOW.md`

## Bildproduktion

Verbindlicher Ablauf:

1. Bildplan fertigstellen.
2. Genau 3 Cover-Kandidaten erzeugen.
3. 1 Gewinner automatisch wählen.
4. Gewinner als `Bild 01.png` speichern und die 2 anderen Cover löschen.
5. Nur `Bild 01.png` als visuelle Referenz für alle weiteren Bilder benutzen.
6. Bild 02–NN in maximal 5er-Blöcken erzeugen.
7. Nicht-Cover-Bilder jeweils nur einmal erzeugen.
8. Am Ende alle finalen Bilder flach in `00-bildprompts/images/` halten.

Finaler Bilderordner enthält ausschließlich `Bild 01.png` bis `Bild NN.png`.
