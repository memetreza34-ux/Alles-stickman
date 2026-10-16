# Kontinuierliche Video-Verbesserung — HÖCHSTE PRIORITÄT

Diese Arbeitsweise ist **verbindlich für jedes neue StrichKosmos / Alles-Stickman-Video**. Ein neues Video soll nicht einfach dieselben Fehler wiederholen.

## Nach JEDEM fertig gerenderten Video

1. **Vollständig ansehen und anhören**: das echte `03-export/FINAL_VIDEO.mp4` von 0:00 bis zum Schluss, mit Bild, Audio, Skript, SRT, Cover, YouTube-Beschreibung und Exportdateien. Keine Review als erledigt markieren, wenn nur Screenshots vorliegen.
2. **Zeitstempel und Bildnummern notieren**: Was funktioniert? Was stimmt nicht? Hook, Story, Recherche, Bildinhalt, Stil/Anatomie/Text, Stimmung/Umgebung, Schnitt/Pacing, Stimme/Aussprache/Lautstärke, Cover, Titel, Caption/Hashtags und technische Fehler.
3. **Root Cause von Symptomen trennen**: z. B. „grüne Sommerlandschaft bei Eiszeit“ → fehlender Klimaanker im Bildprompt, nicht nur „Bild schlecht“.
4. **Gemeinsame Ursachen zentral beheben**: Betroffene Vorgaben in `config/script-policy.json`, `config/visual-policy.json`, `config/pipeline.json`, Google-Flow-Masterprompt, Templates, Validatoren oder Remotion anpassen. Das nächste Video erbt diese Verbesserungen. **Nicht nur das eine Video korrigieren.**
5. **Verifizieren**: geänderte Prompts gegen den konkreten Fehler prüfen, Tests ergänzen/ausführen, bei visuellen Fragen Bildstichproben/Kontrastbilder ansehen. Bei rein subjektiven Änderungen Experimente statt vermeintlich bewiesene Regeln dokumentieren.
6. **Review abschließen**: `POST_VIDEO_REVIEW.json` einschließlich Stärken, Zeitstempeln, Ursache, Änderung und Tests ausfüllen, dann `npm run quality:close -- --dir "youtube/<week>/<slug>"` ausführen. Geprüfte Lessons werden im `channel/IMPROVEMENT_LEDGER.json` registriert.
7. **Nächstes Video erst danach**: `npm run create:youtube` überprüft lokal die exportierten Videos und blockiert neue Projekte, deren Review unvollständig ist.

## Praktische Kommandos

```bash
npm run quality:init -- --dir "youtube/<week>/<slug>"
# POST_VIDEO_REVIEW.json bearbeiten: echte Beobachtungen, reale Tests/Verbesserungen
npm run quality:close -- --dir "youtube/<week>/<slug>"
npm run quality:status
```

Das normale `phase3:youtube` erstellt nach erfolgreichem Render/Export automatisch eine **ausstehende** Review-Datei. Eine Review schließt sich **niemals selbst ab**.

## Welche Fehler wir gezielt verfolgen

- **Hook**: Erste 5–30 Sekunden halten die Frage offen; weder belanglose Atmosphäre noch verwirrendes Versprechen.
- **Skript**: Logische Reihenfolge, Faktenbelege, klare Beispiele, keine Füllsätze, guter Schluss.
- **Bilder**: Stickman (keine echten Menschen), passende Lebendigkeit, visuelle Vielfalt, keine falschen Requisiten/Epochen, keine winzigen englischen Labels oder Rendernotizen, keine zufällige andere Jahreszeit.
- **Audio/Schnitt**: Verständliche Stimme, kein plötzliches Lautstärke-/Tempo-Chaos, passende Bild-Audio-Synchronität, realistische Bildhaltezeiten und Ende.
- **Verpackung**: Ehrlicher Titel/Thumbnail, lesbarer Text, Beschreibung plus thematische Hashtags.

## Verbesserungskarte statt Bauchgefühl

Jede Beobachtung enthält **Zeitstempel / Bildnummer**, ein überprüfbares Problem, einen wahrscheinlichen Ursachenhinweis, eine konkrete Maßnahme und Nachweis der Prüfung. **MAJOR / CRITICAL** müssen vor Reviewabschluss durch eine nachweislich getestete Änderung gelöst sein; **MINOR** kann mit Begründung in den Backlog.

Eine korrigierte Policy ersetzt kein neues Bild und ein guter CI-Test beweist nicht, dass jedes Bild optisch perfekt ist. Änderungen werden zunächst als Hypothese behandelt und durch reale Videos und Daten erneut geprüft.

## Nach Upload: mit Daten lernen

Wenn YouTube Studio Werte verfügbar sind: Impressionen, CTR, Zuschauerbindung nach 30 Sekunden, durchschnittliche Wiedergabedauer und **konkrete Dips/Spikes mit Zeitstempeln** ergänzen. Ein Retention-Dip ist ein Indiz, keine bewiesene Ursache. Ein Spike kann auch Unverständlichkeit bedeuten. Niedrige CTR isoliert oder bei breiter werdender Ausspielung nicht pauschal als schlechtes Thumbnail werten.

**Quellen:** [YouTube-Hilfe: Zuschauerbindung](https://support.google.com/youtube/answer/9314415?hl=de), [YouTube-Hilfe: CTR/Impressions interpretieren](https://support.google.com/youtube/answer/16767369).

## Grenzen

Die Pipeline kann Verzeichnisse, Reports und Regelverstöße kontrollieren. Sie kann ohne die echte MP4 und ihre Bilder **keine visuelle oder dramaturgische Vollprüfung vortäuschen**. Auch eine automatische YouTube-Analytics-Verbindung existiert noch nicht. Analyse und Policies werden erst durch nachgewiesene Review-Daten verbessert, nicht durch erfundene Messwerte.
