# StrichKosmos — verbindliche Premium-Bildwelt v13

**Status:** APPROVED BY USER · **Style-ID:** `alles-stickman-editorial-v1` (Kompatibilität bleibt) · **Style edition:** `premium-illustrated-explainer-v13`

## Endgültige Identität

Die fünf zuletzt freigegebenen **englischen Bildprompts** sind unsere maßgebliche kreative Qualitätsreferenz für **alle Themen**. Wir übernehmen die _Zeichenqualität_ – nicht jedes Motiv, dieselbe Landschaft oder die exakte Farbmischung.

**Gleichbleibend:** hochwertige von Hand gezeichnet wirkende 2D-Editorial-Illustration; kräftige, leicht unregelmäßige anthrazitfarbene Konturen; schlüssige vereinfachte Gegenstände; selektive Flächenfarben und dezente Schatten; starke klar lesbare Komposition; erzählerische Details; hohe Qualität auch bei kleiner YouTube-/Mobilansicht. Menschen sind, wenn nötig, klar erkennbare Stickman-Figuren mit einfachen schmalen Strichgliedmaßen, runden warmen Köpfen, lebendiger Mimik und passend vereinfachter Kleidung.

**Bewusst wechselnd:** Farbe, Licht, Hintergrund, Epoche, Objektanzahl, Perspektive, Grad der Raumtiefe und das **Bildformat der Erklärung**. Ein Waldweg kann grün/blau, ein Stromkreis neutral/ocker, ein Psychologie-Vergleich korall/teal, eine römische Stadt terrakotta/himmelblau und ein Wasserkreislauf blau/grün sein – alle durch denselben Linien- und Illustrationslook verbunden.

## Fünf gleichwertige bewährte Bildtypen

| Typ | Visuelles Prinzip | Verbindlicher englischer Referenzprompt |
|---|---|---|
| Story / Hook | Handlung, Ausdruck, klare Entscheidung, kontextreiche Umgebung | [01 Stickman-Reiseszene](style-reference-prompts/01_story_without_gps.txt) |
| Technik | Großes korrekt verbundenes Objekt-/Funktionsschema, **keine Figuren erforderlich** | [02 Elektrischer Stromkreis](style-reference-prompts/02_technical_circuit.txt) |
| Psychologie | Zwei klar verbundene Momente, expressive einfache Stickmen, minimaler Text | [03 Türschwellen-Effekt](style-reference-prompts/03_psychology_doorway.txt) |
| Geschichte | Historisch passende lebendige Darstellung mit optionalem erklärendem Querschnitt | [04 Römisches Aquädukt](style-reference-prompts/04_roman_aqueduct.txt) |
| Naturwissenschaft | Schöne einheitliche Prozessillustration mit großen verständlichen Pfeilen und wenigen deutschen Labels | [05 Wasserkreislauf](style-reference-prompts/05_water_cycle.txt) |

**Keine Hierarchie:** Die jeweils sinnvollste Visualisierung des gesprochenen Satzes gewinnt. Eine gute Sachgrafik muss keine Figur enthalten. Nicht jede Szene braucht Text, nicht jede zweite Szene eine Infografik und nicht jedes historische Thema eine alte Karte.

## Sprache und Copy-Workflow

- **Alle Google-Flow-Prompts, Cover-, Szenen- und Batch-Anweisungen werden komplett auf Englisch geschrieben.**
- **Alle im fertigen Bild sichtbaren Wörter müssen auf Deutsch sein.** Labels nur bei echtem Nutzen, üblicherweise 0–2, bei technischen/naturwissenschaftlichen Diagrammen maximal 3. Genau vorgeben; wenn Google Flow Schreibfehler erzeugt, Bildtext wegnehmen und ggf. im Schnitt als Overlay hinzufügen.
- Sprechertext bleibt auf Deutsch. Die vollständigen englischen Prompts werden als direkt kopierbare Dateien in den Video-Ordnern abgelegt.
- Wenn Menschen gezeigt werden, bleiben sie Stickmen. **Gegenstände, Landschaften, Querschnitte und Abläufe dürfen ganz ohne Menschen sein.**
- Stets 16:9 (1920×1080), gut lesbar bei kleinem Bild.

## Harte No-Gos

Keine fotorealistischen oder halb-realistischen Menschen; kein 3D/Pixar/Anime; keine ständig gleiche beige historische Buch-/Pergamentkarte; keine grellgrüne Vektor-Schulclipart; keine vier winzigen Arbeitsblatt-Kästen; keine langen oder englischen Bildbeschriftungen; keine automatisch eingefügten Überschriften; keine generierten Bildreferenzen oder mitgerenderten Prompt-Metadaten.

## Gilt ab sofort

- Zentral: `config/visual-policy.json` ab v13.
- Vorlagen: `youtube/templates/video-template/00-bildprompts/`.
- Bestehendes GPS-Video: alle individuellen englischen Prompts / Batch-Dateien und der Master verwenden die gleiche Stilidentität.
- Neue Videos: Promptautor muss pro Skriptsatz **Bildtyp begründen**, im passenden Editorial-Look formulieren und im 5er-Block still anhand echter Resultate prüfen; gesprochene Szene und realer Bildinhalt müssen übereinstimmen.
- Die fünf Prompts sind **Stilreferenzen**, keine automatische Bildgenerierung. Nie ohne ausdrücklichen Wunsch selbst Bilder erstellen.
