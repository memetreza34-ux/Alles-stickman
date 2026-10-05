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

### 3. Einen Gewinner wählen

Der Agent entscheidet automatisch anhand von:
- Klarheit
- Neugier
- Lesbarkeit
- Stiltreue
- fehlerfreier Darstellung
- sachlicher/historischer Plausibilität

Danach:
- Gewinner → `Bild 01.png`
- zwei Verlierer löschen
- keine Kopien der Verlierer behalten

`Bild 01.png` wird anschließend als einzige Bildreferenz für alle weiteren Bilder verwendet.

### 4. Restbilder in 5er-Blöcken

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
- ausschließlich Bild 01 als Referenz
- vorherige Szenenbilder niemals als Referenz
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

## Referenzbild-Regel

Nur `Bild 01.png` dient als visuelle Referenz.

Es stabilisiert Stil und Figurenwelt, aber nicht die Komposition.

Neue Bilder müssen weiterhin individuell zum gesprochenen Inhalt geplant sein.

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
- ein Gewinner gewählt
- zwei Verlierer gelöscht
- Gewinner heißt `Bild 01.png`
- Gewinner war einzige Referenz
- Bild 02–NN wurden in maximal 5er-Blöcken erzeugt
- keine Bildnummer fehlt
- keine temporären Dateien bleiben übrig
- alle finalen Bilder liegen gemeinsam in einem Ordner
