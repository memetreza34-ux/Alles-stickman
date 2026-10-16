## VISUAL STYLE v14 — SINGLE CANONICAL APPROVED MASTER (MANDATORY)

The ONLY authoritative visual style is the FULL English text in `channel/MASTER_VISUAL_STYLE_EN.txt`, consolidated from the five user-approved examples. Embed its COMPLETE verbatim text (not a short reference or summary) into EVERY Flow master, cover prompt, five-image batch and standalone copy-ready image prompt. The five `channel/style-reference-prompts/` files remain examples of ONE shared drawing language across story, technical object, psychology, history and science, not separate image worlds.

All image-generation instructions English, ALL actually visible in-image labels German, usually zero unless essential. Humans only if helpful and ALWAYS drawn as simple expressive 2D stickmen; technically accurate object-only graphics, cutaways, comparisons, and processes are equally eligible. Keep tasteful scene-dependent color, compelling editorial hand-inked quality; never force beige history, cheap green clipart, English annotations or generic text-heavy worksheets. Do not generate images if the user asked only for image prompts.

Source: `channel/MASTER_VISUAL_STYLE_EN.txt`; pipeline tooling: `src/lib/visual-master.js`; validator rejects any missing canonical master text. After Phase 1 give immediate direct links to Google Flow prompt and German voice script. Analyze actual generated images separately; tests only check text compliance.

## HÖCHSTE PRIORITÄT: Aus JEDEM Video systematisch lernen

**Gilt für ChatGPT, Codex, Claude, Google Flow und alle anderen Produktionsagenten.** Ein technisch erfolgreicher Render ist nicht das Ende der Arbeit: Jede echte MP4 muss vollständig angesehen/angehört und mit Zeitstempeln ausgewertet werden. Danach werden **konkrete Ursachen** ermittelt, zentrale Prompts/Skriptregeln/Visual-Policy/Renderer angepasst und Verbesserungen geprüft, sodass das NÄCHSTE Video daraus profitiert.

Verbindliches Regelwerk: `channel/CONTINUOUS_IMPROVEMENT.md`, `config/quality-loop.json`. Per Video `99-technik/POST_VIDEO_REVIEW.json`; globale Lessons `channel/IMPROVEMENT_LEDGER.json`.

Nach Export automatisch `quality:init`, nach realer Qualitätskontrolle `quality:close` ausführen. **Nie behaupten, das MP4 geprüft zu haben, wenn nur ein Dateiname, Screenshot oder CI-Test vorliegt.** Keine erfundenen Analytics. Ohne abgeschlossene Review eines lokal fertigen Videos darf `create:youtube` kein nächstes Projekt erzeugen. Relevante fremde YouTube-Praktiken nur anhand belastbarer Quellen übernehmen; bei Hypothesen experimentell statt dogmatisch vorgehen.

Eine Korrektur darf nicht nur auf ein einziges Bild beschränkt bleiben, wenn die Ursache in einer zentralen Anweisung liegt. Unveränderliche Kanalwelt: einfache 2D-Stickmen, keine echten Menschen, Figuren nur falls nützlich; Coverwahl A/B/C bleibt der einzige Produktions-Human-Gate vor den 5er-Blöcken. Der Qualitätsreview findet nach dem fertigen Video statt und verlangt konkrete Belege.

# Alles Stickman — Anweisungen für alle Coding- und Produktionsagenten

Diese Regeln gelten **für das gesamte Repository** und insbesondere für jedes neue YouTube-Video. Ergänzend gelten `youtube/WORKFLOW.md` und die `config/*-policy.json`-Dateien.

## Phase-1-Abschluss: SOFORT ZWEI LINKS IM CHAT (Smartphone / Tablet / Desktop)

**Harte Ausgaberegel für jede Phase-1-Fertigmeldung:** Die erste sichtbare Nutzantwort nach erfolgreicher Phase 1 muss **zwei direkt anklickbare Links zu den tatsächlich existierenden Dateien im aktuellen Video** enthalten, bevor größere Erklärungen oder Statusberichte kommen:

1. **Google-Flow-Prompt öffnen** → `youtube/<week>/<slug>/00-bildprompts/google-flow-prompt.txt` (Bildproduktion, gegebenenfalls mit zugehörigen 5er-Prompts).
2. **Voice-over-Skript öffnen** → `youtube/<week>/<slug>/01-voice-script/voice-script.txt`.

**Diese Links IM CHAT anzeigen** (Buttons mit URL-Öffnen-Aktion, falls möglich, sonst Markdown-Links). Nicht nur ins Repo schreiben. Der Nutzer arbeitet auch unterwegs am Tablet. Nie verlangen, zunächst GitHub manuell zu durchsuchen; nie ausschließlich den Projektordner oder `PHASE1_START_HERE.md` anbieten. Die Links direkt nach der Fertigmeldung automatisch ausgeben, ohne Nachfrage oder `WEITER`.

Gilt **für jedes zukünftige Video** und für alle Agenten, auch nach Änderungen am Workflow. Die nach Phase 1 generierte Übergabedatei ist eine zusätzliche Absicherung, **kein Ersatz** für den Chat. Vor dem Antworten aktuelle URLs/Dateiexistenz prüfen, keine Platzhalter und keine Links zum falschen Video verwenden. Zum Erzeugen der Chatlinks `src/lib/phase1-handoff.js` nutzen.

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
