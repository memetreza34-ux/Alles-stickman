# Google Flow — vollständiger einmal kopierbarer Prompt

`00-bildprompts/google-flow-prompt.txt` enthält alle Szenen direkt: Stilregeln, Figurenblatt, drei Cover, historische Kontinuität, Szenenregister, automatische 5er-Blöcke und Qualitätsprüfung. **Einmal komplett kopieren**. Weder Repository-Zugriff noch nachgereichte Batch-Dateien sind notwendig. Die optionalen `prompts/`- und `batches/`-Dateien dienen nur der gezielten Reparatur.

1. Fehlendes Figurenblatt aus dem eingebetteten Prompt erzeugen; soweit verfügbar als einzige Figurenreferenz verwenden.
2. Drei Cover produzieren, vor jeder weiteren Generation den Nutzer A/B/C auswählen lassen (HARD STOP).
3. Gewähltes Cover getrennt als `00-bildprompts/thumbnail-source.png` speichern.
4. Eigene Videoszenen ab `Bild 01.png` erzeugen, automatisch in maximal 5er-Batches, bis die geplante Zahl erreicht ist.
5. Jede reale Ausgabe auf Stickfiguren-Anatomie, Epoche, korrekten Bildinhalt und Textartefakte prüfen, nur fehlerhafte Bilder ersetzen.
6. Echte Downloads/ZIP anbieten, niemals Dateien, externe Aktionen oder Qualitätsprüfungen erfinden.
7. Lokal zuerst `check:youtube-images`; anschließend `visual-qc:init`, jedes echte PNG ansehen, dann nach dokumentierter Freigabe `visual-qc:check`. Ohne diese Freigabe darf Phase 2 oder ein direkter Remotion-Render nicht fortgesetzt werden.

Die bereits geplante Salzfolge ist explizit auf die getrennte Cover- und Einstiegsszene migriert. **Noch keine tatsächlichen Bilder oder finale MP4 geprüft**. Alte Projekte behalten für Reproduzierbarkeit ihre ursprüngliche Cover-Logik, bis sie einzeln migriert werden.
