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
3. **STOPPEN.**
4. Nutzer wählt A, B oder C.
5. Gewählten Kandidaten als `Bild 01.png` speichern; die 2 anderen Cover löschen.
6. **Keine Bildreferenz** für Folgebilder benutzen.
7. Genau einen 5er-Block erzeugen: zuerst Bild 02–06.
8. **STOPPEN** und auf `WEITER` warten.
9. Pro `WEITER` genau einen weiteren 5er-Block erzeugen.
10. Am Ende alle finalen Bilder flach in `00-bildprompts/images/` halten.

Kurzform:

```text
3 Cover
→ STOP
→ Nutzer wählt
→ Bild 02–06
→ STOP / WEITER
→ Bild 07–11
→ STOP / WEITER
→ ...
```

Finaler Bilderordner enthält ausschließlich `Bild 01.png` bis `Bild NN.png`.
