# Alles Stickman — Anweisungen für alle Coding- und Produktionsagenten

Diese Regeln gelten **für das gesamte Repository** und insbesondere für jedes neue YouTube-Video. Ergänzend gelten `youtube/WORKFLOW.md` und die `config/*-policy.json`-Dateien.

## Unverzichtbar: Zwei klickbare Links nach Phase 1

Sobald Recherche, Skript, Google-Flow-Prompt, Bildplan und Phase-1-Validierung für ein Videoprojekt fertig sind:

1. Die Datei `99-technik/PHASE1_START_HERE.md` im Videoprojekt mit den korrekten GitHub-Links erstellen/aktualisieren und committen.
2. **Unmittelbar in der Antwort an den Nutzer** beide funktionierenden, anklickbaren Zugänge anzeigen: **Google-Flow-Prompt öffnen** und **Voice-over-Skript öffnen**. Bei einer Oberfläche mit Aktionen können beide als echte anklickbare Buttons dargestellt werden; ansonsten Markdown-Links.
3. Die Links müssen direkt auf die **zwei Dateien** des **gerade erstellten** Videoprojekts zeigen (nicht auf das Template, den Ordner oder ältere Videos).
4. Der Projektordner-Link darf zusätzlich erscheinen, aber **nie die beiden Dateilinks ersetzen**.
5. Auf Smartphone und Desktop sollen diese Links mit einem Tap/Klick erreichbar sein, ohne durch Repository-Ordner navigieren zu müssen.
6. Diese Zwei-Link-Übergabe ist **Teil der Definition of Done für Phase 1**, unabhängig von der Videolänge. Nicht erst auf Nachfrage ergänzen und nicht vergessen.
7. Nicht behaupten, dass der Link Google Flow oder ein TTS-System startet. Er öffnet nur den GitHub-Text, der dort verwendet werden kann.

**URL-Muster** (ersetze `<week>` und `<slug>` durch den echten Projektpfad):

- `https://github.com/memetreza34-ux/Alles-stickman/blob/main/youtube/<week>/<slug>/00-bildprompts/google-flow-prompt.txt`
- `https://github.com/memetreza34-ux/Alles-stickman/blob/main/youtube/<week>/<slug>/01-voice-script/voice-script.txt`

Das direkte Linkformat wird zentral erzeugt von `src/lib/phase1-handoff.js`. Für lokal bearbeitete Projekte:
`npm run handoff:youtube -- --dir "youtube/<week>/<slug>"`.

**Antwortformat nach Phase 1:**

> Phase 1 ist bereit.
>
> [Google-Flow-Prompt öffnen](DIREKTER_GITHUB_DATEILINK) · [Voice-over-Skript öffnen](DIREKTER_GITHUB_DATEILINK)

## Bildproduktion bleibt unverändert

- 3 Cover → HARD STOP → Nutzer wählt A/B/C.
- Danach automatische 5er-Bildblöcke ohne weitere Nutzerrückfragen.
- Finale Bilder vollständig im gemeinsamen Ordner prüfen.
- Keine generierten Referenzbilder; visueller Stil nur über Policy und individuelle Prompts.

## YouTube-Upload mit Hashtags

Bei jeder Video-Phase 1 zusätzlich zur Titel-/Beschreibung-/Tag-Planung **2–3 relevante Hashtags** in `video.json.uploadMetadata.hashtags` eintragen, zum Beispiel `#AllesStickman`, `#Geschichte` und ein konkreter Themen-Hashtag. Der Export `YOUTUBE_UPLOAD.txt` setzt sie automatisch ans Ende der Beschreibung und dedupliziert sie. Die SRT-Untertitel bleiben unverändert. Keine irrelevanten `#Shorts`, `#viral` oder Hashtag-Wände.

Für jedes künftige Google-Flow-Bild gelten `config/visual-policy.json.sceneEnergy` und die aktuellen Masterprompts: lebendige Figuren und Szenen, keine unnötigen englischen winzigen Beschriftungen oder mitgerenderten Produktionsnotizen. Nicht alle Bilder als Cover gestalten; nur dessen klaren Fokus und Ausdruck als Qualitätsmaßstab übernehmen.
