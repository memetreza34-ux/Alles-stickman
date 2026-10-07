# Google Flow Asset Workflow — Alles Stickman

Status: **verbindlich**
Version: **2 — Human-Gated**

## Ziel

Die Bildproduktion darf **nicht** mehr in einem Durchlauf bis zum Ende laufen.

Es gibt zwei harte Freigabearten:

1. **Cover-Gate:** Der Nutzer wählt selbst A, B oder C.
2. **Batch-Gate:** Nach jedem 5er-Block muss der Agent stoppen und auf `WEITER` warten.

## Verbindlicher Ablauf

### Phase 1 — Vorbereitung

Laden:
- `config/visual-policy.json`
- Voice-over-Skript
- fertigen Bildplan
- `99-technik/BILD_AUDIO_ZUORDNUNG.json`

Vor Start müssen Bild 01 bis Bild NN geplant sein.

### Phase 2 — exakt drei Cover erzeugen

Für Bild 01 genau diese drei temporären Kandidaten erzeugen:

```text
TEMP_COVER_A.png
TEMP_COVER_B.png
TEMP_COVER_C.png
```

Danach gilt sofort:

**HARD STOP**

Der Agent darf jetzt:
- keinen Gewinner selbst bestimmen
- keinen Kandidaten löschen
- kein `Bild 01.png` festlegen
- kein `Bild 02.png` oder weiteres Bild erzeugen

Der Agent meldet nur:

```text
COVER-WAHL ERFORDERLICH — antworte A, B oder C.
```

### Phase 3 — Nutzer wählt Cover

Nur eine ausdrückliche Auswahl des Nutzers öffnet das Gate.

Beispiele:
- `A`
- `Cover B`
- `nimm C`

Erst danach:
- gewählter Kandidat → `Bild 01.png`
- die zwei nicht gewählten Kandidaten löschen
- keine Kopien oder Alternativen behalten

Wichtig:
`Bild 01.png` ist Cover und erste Videoszene, wird aber **nicht** als Referenzbild für Folgebilder verwendet.

### Phase 4 — erster 5er-Block

Nach der bestätigten Coverwahl darf genau **ein** Block erzeugt werden:

```text
Bild 02–06
```

Falls das Video vorher endet, nur bis Bild NN.

Danach:

**HARD STOP**

Status:

```text
BLOCK FERTIG — antworte WEITER für den nächsten 5er-Block.
```

### Phase 5 — weitere 5er-Blöcke

Jedes ausdrückliche `WEITER` öffnet genau **einen** weiteren Block.

Beispiel:

```text
Cover gewählt
→ Bild 02–06
→ STOP
→ WEITER
→ Bild 07–11
→ STOP
→ WEITER
→ Bild 12–16
→ STOP
→ WEITER
→ Bild 17–NN
```

Der letzte Block darf kleiner als fünf Bilder sein.

**Verboten:**
- zwei oder mehr 5er-Blöcke im selben Agenten-Schritt
- automatisch zum nächsten Block weiterlaufen
- schon vor `WEITER` Bilder des nächsten Blocks erzeugen

### Phase 6 — Cleanup

Nach Bild NN:
- Bildnummern lückenlos prüfen
- TEMP-Cover löschen
- Alternativen/Zwischenbilder löschen
- keine Unterordner
- final nur `Bild 01.png` bis `Bild NN.png`

## Regeln für Folgebilder

- maximal 5 Bilder pro Block
- jedes Nicht-Cover-Bild nur einmal
- keine A/B-Varianten
- keine Bildreferenz
- weder Bild 01 noch Cover-Verlierer noch vorherige Szenenbilder als Vorlage
- Stil ausschließlich über `config/visual-policy.json` + vollständigen individuellen Prompt
- Illustration zuerst, reine Infografik nur bei echtem Erklärvorteil

## Warum diese Gates existieren

Die frühere Version hatte widersprüchliche Regeln:
- Flow sollte das Cover selbst auswählen
- Flow sollte nicht stoppen
- Flow sollte nach 5er-Blöcken automatisch weitermachen

Dadurch konnte der Agent die gesamte Bildproduktion in einem Zug ausführen.

Die neue Regel ist deshalb absichtlich hart:

> **Cover erzeugen → STOP → Nutzer wählt → 5 Bilder → STOP → WEITER → 5 Bilder → STOP.**

## Endzustand

Fertig bedeutet:
- genau drei Cover wurden erzeugt
- Nutzer hat A/B/C gewählt
- nur diese Auswahl wurde Bild 01
- Cover-Verlierer danach gelöscht
- keine Bildreferenz verwendet
- Folgebilder in echten 5er-Schritten produziert
- zwischen jedem Block wurde gestoppt
- keine Bildnummer fehlt
- finaler Bilderordner enthält nur die nummerierten Endbilder
