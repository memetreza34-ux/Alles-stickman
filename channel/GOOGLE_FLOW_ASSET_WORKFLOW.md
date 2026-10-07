# Google Flow Asset Workflow — Alles Stickman

Status: **verbindlich**
Version: **3 — Cover-Gate + automatische 5er-Produktion**

## Grundregel

Es gibt genau **eine** Stelle, an der Google Flow auf den Nutzer wartet:

> **nach den drei Cover-Kandidaten.**

Nach der Coverwahl läuft die restliche Bildproduktion automatisch bis zum Ende.

## Phase 1 — Vorbereitung

Laden:
- `config/visual-policy.json`
- Voice-over-Skript
- fertigen Bildplan
- `99-technik/BILD_AUDIO_ZUORDNUNG.json`

Vor Start müssen Bild 01 bis Bild NN geplant sein.

## Phase 2 — exakt drei Cover erzeugen

Erzeuge:

```text
TEMP_COVER_A.png
TEMP_COVER_B.png
TEMP_COVER_C.png
```

Danach gilt:

**HARD STOP**

Vor der Nutzerwahl ist verboten:
- selbst einen Gewinner wählen
- einen Kandidaten löschen
- `Bild 01.png` festlegen
- `Bild 02.png` oder weitere Bilder erzeugen

Status:

```text
COVER-WAHL ERFORDERLICH — antworte A, B oder C.
```

## Phase 3 — Nutzer wählt Cover

Der Nutzer wählt A, B oder C.

Erst danach:
- gewählter Kandidat → `Bild 01.png`
- die zwei Verlierer löschen
- keine Cover-Alternativen behalten

`Bild 01.png` ist Cover und erste Videoszene, aber **keine Referenzvorlage** für weitere Bilder.

## Phase 4 — automatische 5er-Blöcke

Direkt nach der Coverwahl:

```text
Bild 02–06
→ automatisch
Bild 07–11
→ automatisch
Bild 12–16
→ automatisch
...
→ Bild NN
```

Regeln:
- maximal 5 Bilder pro Block
- maximal 5 aktive Generationen
- sobald ein Block vollständig gespeichert ist, sofort den nächsten starten
- zwischen Blöcken **nicht fragen**
- zwischen Blöcken **nicht stoppen**
- kein `WEITER` verlangen
- keine weitere Nutzerfreigabe verlangen
- letzter Block darf kleiner als 5 sein
- jedes Nicht-Cover-Bild nur einmal, außer bei technischem Fehler oder eindeutig kaputtem Output

## Phase 5 — gemeinsamer finaler Ordner

Alle finalen Bilder liegen gemeinsam und flach in:

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
- TEMP-Cover nach Abschluss
- Alternativen
- Backup-Bilder
- Unterordner
- zusätzliche Thumbnails
- Zwischenstände

## Phase 6 — Vollständigkeitscheck und automatische Reparatur

Nach Bild NN endet die Arbeit **noch nicht sofort**.

Flow muss:

1. die Soll-Liste `Bild 01.png` bis `Bild NN.png` bilden,
2. den tatsächlichen Ordnerinhalt dagegen prüfen,
3. fehlende Nummern erkennen,
4. technisch kaputte/unbrauchbare Dateien erkennen,
5. genau fehlende oder kaputte Bildnummern anhand ihres ursprünglichen Prompts neu erzeugen,
6. erneut vollständig prüfen,
7. den Check wiederholen, bis alle Nummern lückenlos vorhanden sind,
8. Zusatz-/TEMP-/Doppeldateien entfernen.

Fertig bedeutet:

```text
Anzahl = NN
Nummern = 01 bis NN lückenlos
Ordner = genau ein gemeinsamer images-Ordner
Zusatzbilder = 0
fehlende Bilder = 0
```

## Referenzregel

Für Bild 02 bis Bild NN wird **kein generiertes Bild als Referenz** benutzt.

Konsistenz kommt ausschließlich aus:
- `config/visual-policy.json`
- vollständigem individuellen Bildprompt
- fester Linien-, Farb-, Gesichts- und Informationsdesign-Logik

## Kurzform

> **3 Cover → STOP → Nutzer wählt → 5 Bilder → automatisch nächste 5 → automatisch nächste 5 → bis Ende → Gesamtcheck → fehlende Bilder neu erzeugen → erneut prüfen.**
