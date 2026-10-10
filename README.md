# Alles Stickman

Produktionsrepository für einen deutschsprachigen faceless YouTube-Erklärkanal über Menschheit, Evolution, Geschichte, Alltag, Erfindungen, Ressourcen und ungewöhnliche Fragen.

## Kernsystem

- eigene Stickman-Bildwelt: `config/visual-policy.json`
- Kanalrichtung: `channel/CHANNEL_DIRECTION.md`
- Referenzanalyse: `channel/REFERENCE_ANALYSIS.md`
- Bildwelt-Dokumentation: `channel/VISUAL_WORLD.md`
- Google-Flow-Ablauf: `channel/GOOGLE_FLOW_ASSET_WORKFLOW.md`
- aktueller Systemstatus: `channel/SYSTEM_STATUS.md`
- System-Audit: `channel/SYSTEM_AUDIT.md`
- komplette Produktionsanleitung: `youtube/WORKFLOW.md`

## Phase 1: Prompt und Skript direkt öffnen

Nach Phase 1 erscheinen **immer zwei anklickbare Links** im Chat:

- Google-Flow-Prompt direkt im jeweiligen Projekt öffnen
- Voice-over-Skript direkt im jeweiligen Projekt öffnen

Die Projektdatei `99-technik/PHASE1_START_HERE.md` enthält beide Direktlinks für Smartphone und Desktop. Erzeugung: `npm run handoff:youtube -- --dir "youtube/<week>/<slug>"`; die erfolgreiche Phase-1-Prüfung erzeugt/aktualisiert sie ebenfalls. Agentenpflicht siehe `AGENTS.md`.

## Bildproduktion

Verbindlicher Ablauf:

1. Bildplan fertigstellen.
2. Genau 3 Cover-Kandidaten erzeugen.
3. **STOPPEN.**
4. Nutzer wählt A, B oder C.
5. Gewählten Kandidaten als `Bild 01.png` speichern; die 2 anderen Cover löschen.
6. Danach **keine weitere Nutzerfreigabe** mehr verlangen.
7. Folgebilder automatisch in Blöcken mit maximal 5 Bildern erzeugen: Bild 02–06, direkt danach Bild 07–11, danach der nächste Block usw.
8. Keine Bildreferenz für Folgebilder benutzen.
9. Alle finalen Bilder gemeinsam flach in `00-bildprompts/images/` speichern.
10. Nach Bild NN den gesamten Ordner prüfen. Fehlt eine Bildnummer oder ist eine Datei technisch kaputt, genau dieses Bild neu erzeugen.
11. Erst fertig melden, wenn `Bild 01.png` bis `Bild NN.png` lückenlos vorhanden sind und keine Zusatzbilder übrig sind.

Kurzform:

```text
3 Cover
→ STOP
→ Nutzer wählt A/B/C
→ Bild 02–06
→ automatisch Bild 07–11
→ automatisch Bild 12–16
→ ...
→ Bild NN
→ Vollständigkeitscheck
→ fehlende Bilder reparieren
→ finaler gemeinsamer Bilderordner
```

**Es gibt nur einen Human-Gate: die Coverwahl.** Zwischen den 5er-Blöcken wird nicht gefragt und nicht auf `WEITER` gewartet.
