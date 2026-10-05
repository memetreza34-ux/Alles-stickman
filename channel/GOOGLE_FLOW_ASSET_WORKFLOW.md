# Google Flow Asset Workflow — Alles Stickman

Status: verbindlich

## Ziel

Google Flow bzw. der ausführende Agent soll die komplette Bildproduktion eines Videos ohne ständige Rückfragen sauber durchziehen.

## Die 5 Schritte

### 1. Vorbereitung

Laden:
- `config/visual-policy.json`
- Voice-over-Skript
- fertigen Bildplan
- `99-technik/BILD_AUDIO_ZUORDNUNG.json`

Vor Start müssen alle Bildnummern von Bild 01 bis Bild NN feststehen.

### 2. Drei Cover-Kandidaten

Für Bild 01 genau drei temporäre Kandidaten erzeugen:
- `TEMP_COVER_A.png`
- `TEMP_COVER_B.png`
- `TEMP_COVER_C.png`

Keine weiteren Covervarianten.

### 3. Google Flow wählt den Gewinner

Google Flow entscheidet selbstständig anhand von:
- Klarheit
- Neugier
- Lesbarkeit
- Stiltreue
- fehlerfreier Darstellung
- sachlicher/historischer Plausibilität

Der Nutzer wählt nicht manuell.

Danach:
- Gewinner → `Bild 01.png`
- zwei Verlierer löschen
- keine Kopien der Verlierer behalten

Wichtig: `Bild 01.png` wird danach **nicht** als Referenzbild für weitere Bilder verwendet.

### 4. Restbilder in 5er-Blöcken — ohne Bildreferenz

Ohne Nutzer-Rückfrage weiterarbeiten.

Beispiel:

```text
Block 1: Bild 02–06
Block 2: Bild 07–11
Block 3: Bild 12–16
...
```

Der letzte Block darf kleiner sein.

Regeln:
- maximal 5 aktive Generationen
- jedes Bild nur einmal
- keine A/B-Varianten für Nicht-Cover-Bilder
- **keine Bildreferenz verwenden**
- weder Bild 01 noch andere Cover oder vorherige Szenen als Vorlage benutzen
- Stil ausschließlich über `config/visual-policy.json` und den vollständigen individuellen Textprompt halten
- sofort korrekt benennen
- nach jedem Block automatisch weiter

Technische Ausnahme:
Wenn Flow technisch fehlschlägt oder ein Output eindeutig unbrauchbar/kaputt ist, darf nur genau diese Bildnummer erneut erzeugt werden.

### 5. Abschluss und Cleanup

Finaler Ordner:

`00-bildprompts/images/`

Erlaubt:

```text
Bild 01.png
Bild 02.png
Bild 03.png
...
Bild NN.png
```

Nicht erlaubt:
- `TEMP_COVER_A.png`
- `TEMP_COVER_B.png`
- `TEMP_COVER_C.png`
- Cover-Verlierer
- Alternativen
- Backup-Bilder
- Unterordner
- zusätzliche Thumbnails
- Zwischenstände

## Konsistenzregel ohne Referenzbild

Die visuelle Konsistenz kommt ausschließlich aus:
1. `config/visual-policy.json`
2. dem vollständigen Prompt des jeweiligen Bildes
3. den festen Kanalregeln für Linien, Farben, Figuren, Text und Informationsdesign

Kein bereits generiertes Bild wird als Stilvorlage verwendet.

Das ist absichtlich so, weil ein Cover auf Klickstärke optimiert ist und Karten, Diagramme, Multi-Panels oder andere Erklärformen sonst unnötig einengen kann.

## Kein Stoppen zwischen Blöcken

Der Agent soll nicht nach jedem Bild oder nach jedem 5er-Block fragen.

Er stoppt nur, wenn eine Pflichtquelle fehlt, zum Beispiel:
- kein Skript
- kein fertiger Bildplan
- keine aktive Bildwelt
- keine eindeutige Bildnummerierung

Ansonsten läuft die Produktion bis Bild NN und anschließend durch das Cleanup.

## Endzustand

Fertig bedeutet:
- drei Cover wurden erzeugt
- Google Flow hat selbst einen Gewinner gewählt
- zwei Verlierer gelöscht
- Gewinner heißt `Bild 01.png`
- Bild 01 wurde nicht als Referenzbild weiterverwendet
- für Bild 02–NN wurde überhaupt keine Bildreferenz benutzt
- Bild 02–NN wurden in maximal 5er-Blöcken erzeugt
- keine Bildnummer fehlt
- keine temporären Dateien bleiben übrig
- alle finalen Bilder liegen gemeinsam in einem Ordner
